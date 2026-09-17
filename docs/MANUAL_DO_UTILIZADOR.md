# Manual do Utilizador

[English](USER_MANUAL.md)

Este manual descreve o fluxo normal para carregar, preparar e transcrever fichas de vigilância de mosquitos.

## Iniciar sessão

Abra o endereço da aplicação fornecido pelo administrador do sistema e introduza o nome de utilizador e a palavra-passe atribuídos.

## Carregar imagens

1. Abra o separador **Carregar**.
2. Escolha **Seleccionar Ficheiros** para seleccionar imagens individuais ou **Seleccionar Pasta** para seleccionar uma pasta.
3. Reveja a fila de carregamento. Remova um ficheiro com o botão × ou limpe toda a fila com **Limpar Fila**.
4. Seleccione **Carregar Ficheiros** e aguarde até o indicador de progresso terminar.

São aceites imagens PNG e JPEG. Os nomes dos ficheiros carregados são normalizados para utilizar a extensão `.png`.

A tabela de documentos abaixo dos controlos de carregamento mostra se existem metadados, segmentação, transcrição e um registo de conclusão para cada imagem. Utilize **Actualizar Lista** para actualizar a tabela ou o campo de filtro para procurar um nome de ficheiro.

## Escolher um documento

A barra lateral apresenta os documentos que ainda não foram marcados como concluídos. As colunas de estado indicam se cada documento tem metadados, uma tabela segmentada e dados de transcrição. Seleccione um nome de ficheiro para continuar o respectivo fluxo de trabalho.

## Registar a informação do documento

1. Abra o separador **Documento**.
2. Seleccione o tipo de documento. Se houver dúvidas, utilize **Fluxograma de ID do Documento**.
3. Introduza a província, distrito ou município, localidade, bairro, data de colheita e mês ou ano de pulverização disponíveis.
4. Seleccione **Submeter informação do documento**. Também pode utilizar `Ctrl+Enter` enquanto este separador estiver activo.

Introduza apenas a informação visível no documento original. Deixe um campo vazio quando a informação não estiver disponível, em vez de inferir um valor.

## Corrigir a distorção da tabela

1. Abra **Corrigir Distorção**.
2. Começando no canto superior esquerdo da tabela de dados, coloque pontos ao longo da margem superior.
3. Continue no sentido horário ao longo da margem inferior correspondente, terminando no canto inferior esquerdo. Utilize o mesmo número de pontos nas margens superior e inferior.
4. Arraste um ponto para ajustar a sua posição. Utilize **Redefinir pontos** para recomeçar.
5. Seleccione **Aplicar correcção**.
6. Inspeccione a imagem resultante. Volte a este separador e repita o processo se as linhas e colunas não estiverem suficientemente rectangulares.

## Transcrever a tabela

1. Abra **Transcrição**.
2. Se o limite da tabela ainda não estiver definido, clique nos cantos superior esquerdo e inferior direito da área de dados. Um rectângulo azul deverá envolver a tabela.
3. Prima a barra de espaço para mostrar ou ocultar a sobreposição das células detectadas.
4. Utilize as teclas de seta para navegar entre as células.
5. Introduza o valor visível na célula ampliada ou escolha um valor predefinido disponível. Utilize `?` quando não for possível ler o valor.
6. Seleccione **Submeter transcrição** para guardar a transcrição actual.
7. Depois de rever o documento, seleccione **Marcar transcrição como completa**. O documento concluído é removido da lista activa e, quando disponível, é seleccionado o documento incompleto seguinte.

Os botões de transcrição automática e de correcção de linhas ou colunas são auxiliares opcionais. Compare sempre o resultado com a imagem original antes de o guardar. A transcrição automática só está disponível quando o administrador tiver configurado o serviço externo necessário.

## Resolver itens de verificação

O botão **Verificações** abre a lista de células que necessitam de nova revisão.

1. Seleccione um item para abrir o respectivo documento e focar a célula assinalada.
2. Compare a transcrição com a imagem original e corrija o valor, se necessário.
3. Guarde a transcrição.
4. Seleccione o botão ✓ no item de verificação para o marcar como resolvido.

## Exportar resultados

Utilize as ligações no topo da barra lateral para descarregar:

- **Descarregar CSV de Transcrição** para os dados de transcrição das tabelas.
- **Descarregar CSV de Documentos** para os metadados dos documentos.

Trate os ficheiros exportados de acordo com os requisitos de privacidade e gestão de dados definidos para o projecto.
