#!/usr/bin/env python3

import argparse
import json
from pathlib import Path

import geopandas as gpd
import folium


def build_map(
    geojson_path: str,
    output_html: str,
    tooltip_fields=None,
    popup_fields=None,
    tiles: str = "OpenStreetMap",
):
    # Load GeoJSON into a GeoDataFrame
    gdf = gpd.read_file(geojson_path)

    if gdf.empty:
        raise ValueError("GeoJSON contains no features.")

    # Reproject to WGS84 if needed (Folium expects EPSG:4326 / lat-lon)
    if gdf.crs is not None and gdf.crs.to_epsg() != 4326:
        gdf = gdf.to_crs(epsg=4326)

    # Find a reasonable center for the map
    bounds = gdf.total_bounds  # [minx, miny, maxx, maxy]
    center_lat = (bounds[1] + bounds[3]) / 2
    center_lon = (bounds[0] + bounds[2]) / 2

    m = folium.Map(location=[center_lat, center_lon], zoom_start=10, tiles=tiles)

    # Use requested fields if they exist
    valid_columns = [c for c in gdf.columns if c != "geometry"]
    tooltip_fields = [f for f in (tooltip_fields or []) if f in valid_columns]
    popup_fields = [f for f in (popup_fields or []) if f in valid_columns]

    tooltip = None
    popup = None

    if tooltip_fields:
        tooltip = folium.GeoJsonTooltip(fields=tooltip_fields)

    if popup_fields:
        popup = folium.GeoJsonPopup(fields=popup_fields)

    # Simple styling function
    def style_function(feature):
        geom_type = feature["geometry"]["type"]
        if geom_type in ("Polygon", "MultiPolygon"):
            return {
                "fillColor": "#3388ff",
                "color": "#3388ff",
                "weight": 2,
                "fillOpacity": 0.3,
            }
        elif geom_type in ("LineString", "MultiLineString"):
            return {
                "color": "#ff5733",
                "weight": 3,
            }
        else:
            return {}

    # Highlight on hover
    def highlight_function(feature):
        return {
            "weight": 4,
            "fillOpacity": 0.5,
        }

    # Add polygons/lines as GeoJson
    non_points = gdf[~gdf.geometry.geom_type.isin(["Point", "MultiPoint"])]
    if not non_points.empty:
        folium.GeoJson(
            data=json.loads(non_points.to_json()),
            name="GeoJSON features",
            style_function=style_function,
            highlight_function=highlight_function,
            tooltip=tooltip,
            popup=popup,
        ).add_to(m)

    # Add points separately as CircleMarkers
    points = gdf[gdf.geometry.geom_type.isin(["Point", "MultiPoint"])]
    if not points.empty:
        for _, row in points.iterrows():
            geom = row.geometry

            if geom.geom_type == "Point":
                pts = [geom]
            else:
                pts = list(geom.geoms)

            for pt in pts:
                popup_html = None
                if popup_fields:
                    popup_html = "<br>".join(
                        f"<b>{field}</b>: {row.get(field)}" for field in popup_fields
                    )

                tooltip_text = None
                if tooltip_fields:
                    tooltip_text = " | ".join(
                        f"{field}: {row.get(field)}" for field in tooltip_fields
                    )

                folium.CircleMarker(
                    location=[pt.y, pt.x],
                    radius=5,
                    popup=popup_html,
                    tooltip=tooltip_text,
                    fill=True,
                ).add_to(m)

    folium.LayerControl().add_to(m)
    m.fit_bounds([[bounds[1], bounds[0]], [bounds[3], bounds[2]]])
    m.save(output_html)
    print(f"Saved map to: {output_html}")


def main():
    parser = argparse.ArgumentParser(
        description="Render a GeoJSON file to an interactive Folium map."
    )
    parser.add_argument("geojson", help="Path to input GeoJSON file")
    parser.add_argument(
        "-o",
        "--output",
        default="map.html",
        help="Output HTML path (default: map.html)",
    )
    parser.add_argument(
        "--tooltip-fields",
        nargs="*",
        default=[],
        help="Fields to show in hover tooltip",
    )
    parser.add_argument(
        "--popup-fields",
        nargs="*",
        default=[],
        help="Fields to show in click popup",
    )
    parser.add_argument(
        "--tiles",
        default="OpenStreetMap",
        help="Folium tile layer name (default: OpenStreetMap)",
    )

    args = parser.parse_args()

    build_map(
        geojson_path=args.geojson,
        output_html=args.output,
        tooltip_fields=args.tooltip_fields,
        popup_fields=args.popup_fields,
        tiles=args.tiles,
    )


if __name__ == "__main__":
    main()
