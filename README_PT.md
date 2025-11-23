# Aplicação Web de Transcrição de Dados de Mosquitos

Uma ferramenta baseada na web para digitalizar dados de vigilância de mosquitos escritos à mão a partir de formulários de campo. Esta aplicação simplifica o processo de conversão de formulários em papel digitalizados em dados digitais estruturados através da identificação de documentos, correção de imagens e transcrição assistida.

## Visão Geral

Esta ferramenta foi concebida para ajudar a transcrever dados escritos à mão de formulários de vigilância de mosquitos recolhidos em Moçambique. Os formulários contêm dados tabulares sobre capturas de mosquitos, incluindo informações sobre localizações, datas de colheita, características das casas (paredes, chãos, tectos) e contagens de mosquitos por espécie.

A aplicação guia-o através de três fases principais:
1. **Identificação de Documentos** - Identificar o tipo de documento e inserir metadados
2. **Correcção de Distorção** - Corrigir a distorção da imagem para criar uma vista de tabela limpa e rectangular
3. **Transcrição** - Transcrever eficientemente os dados usando atalhos de teclado

## Começar

### Carregar Ficheiros

1. Clique no botão **"Carregar Ficheiros"** na barra lateral
2. Seleccione ficheiros de imagem individuais ou uma pasta inteira de formulários digitalizados
3. Formatos suportados: PNG, JPG, JPEG
4. Os ficheiros serão carregados para o servidor e aparecerão na lista de ficheiros fonte

### Indicadores de Estado dos Ficheiros

A barra lateral mostra o estado de processamento de cada documento:
- **Doc** - Os metadados do documento foram inseridos
- **Seg.** - A imagem foi corrigida/segmentada
- **Dados** - Os dados foram transcritos
- **Amarelo** - Conclusão parcial
- **Verde** - Completamente concluído

Clique em qualquer ficheiro na barra lateral para começar a trabalhar nele.

---

## Separador 1: Informação do Documento (Documento)

O separador Documento é onde identifica o tipo de formulário e insere metadados importantes sobre o documento.

### Objectivo
Antes de transcrever os dados, precisa de informar o sistema sobre o tipo de formulário. Diferentes tipos de formulários têm diferentes estruturas de colunas, que o sistema usa para orientar a transcrição.

### Passos

1. **Seleccionar Tipo de Documento**
   - Escolha do menu suspenso (por exemplo, "Anopheles Gambiae s.1", "Procopack", etc.)
   - O sistema carregará o modelo apropriado para esse tipo de formulário
   - Pode clicar em exemplos de cabeçalhos para ajudar a identificar o tipo correcto

2. **Inserir Informação de Localização**
   - **Província**: Seleccione do menu suspenso
   - **Distrito/Município**: Digite para autocompletar
   - **Localidade/Povoação**: Até 2 localizações
   - **Bairro**: Até 2 bairros

3. **Inserir Detalhes de Colheita**
   - **Data de colheita**: Data em que os mosquitos foram capturados
   - **Ano/mês de pulverização**: Quando a área foi pulverizada pela última vez

4. **Submeter**
   - Clique em **"Submeter informação do documento"** para guardar os metadados
   - O sistema avançará automaticamente para o separador de Correcção de Distorção

### Dicas
- Use as funcionalidades de autocompletar para localizações para manter a consistência
- O sistema preencherá automaticamente a Província quando seleccionar um Distrito
- Pode voltar e editar esta informação mais tarde, se necessário

---

## Separador 2: Correcção de Imagem (Corrigir Distorção)

O separador de Correcção de Distorção corrige a distorção de perspectiva e inclinação nas imagens digitalizadas para criar uma vista limpa e rectangular da tabela de dados.

### Objectivo
Os formulários de campo são frequentemente fotografados num ângulo ou com o papel curvo/deformado. Este separador permite-lhe marcar os cantos da tabela de dados para que o sistema possa digitalmente "achatá-la" num rectângulo perfeito, facilitando e tornando a transcrição mais precisa.

### Passos

1. **Marcar os Cantos da Tabela**
   - Clique ao longo da **borda superior** da tabela de dados, da esquerda para a direita
   - Comece no canto superior esquerdo
   - Clique em vários pontos ao longo do topo (os cantos são mais fáceis, mas mais pontos = melhor precisão)
   - Depois clique ao longo da **borda inferior**, indo da direita para a esquerda (sentido horário)
   - Termine no canto inferior esquerdo

2. **Ajustar Pontos**
   - Pode arrastar e reposicionar qualquer ponto clicando perto dele
   - Certifique-se de que tem o mesmo número de pontos em cima e em baixo

3. **Aplicar Correcção**
   - Clique em **"Aplicar correcção"**
   - O sistema processará a imagem e criará uma versão corrigida
   - Moverá automaticamente para o separador de Transcrição

4. **Tente Novamente se Necessário**
   - Se o resultado não for quadrado suficiente, volte a este separador
   - Clique em **"Redefinir pontos"** para começar de novo
   - Adicione mais pontos ou ajuste as suas posições para melhores resultados

### Dicas
- Mais pontos = correcção mais precisa (aponte para 4-6 pontos por aresta)
- Clique nos cantos/arestas reais das células de dados, não na borda do papel
- O contorno da tabela deve ficar azul quando tiver pontos correspondentes em cima e em baixo

---

## Separador 3: Transcrição de Dados (Transcrição)

O separador de Transcrição é onde insere os dados reais do formulário no sistema usando atalhos de teclado para máxima eficiência.

### Objectivo
Transcrever os dados tabulares célula a célula. O sistema destaca a célula actual, mostra uma vista ampliada e usa atalhos de teclado para acelerar a entrada de dados.

### Começar

1. **Definir a Área de Dados**
   - Clique no **canto superior esquerdo** da tabela de dados (normalmente linha 1, coluna 1)
   - Clique no **canto inferior direito** da tabela de dados
   - A área de dados será contornada a azul

2. **Começar a Transcrever**
   - A primeira célula de dados será destacada a vermelho (linha 1, coluna 1)
   - Uma vista ampliada da célula aparece acima
   - Digite o valor que vê na célula

### Fluxo de Trabalho de Transcrição: Coluna por Coluna

**Importante:** A aplicação foi concebida para **transcrição coluna por coluna**, não linha por linha. Isto significa que preenche todos os valores numa coluna antes de passar para a coluna seguinte.

**Como funciona:**
- Quando insere um valor (especialmente dígitos únicos em colunas de números), o sistema move-se automaticamente **para baixo** para a linha seguinte na mesma coluna
- Quando chega ao fundo de uma coluna, o sistema passa automaticamente para o **topo da coluna seguinte**
- Este fluxo de trabalho vertical é muito mais rápido do que mover-se horizontalmente através das linhas

**Exemplo de fluxo de trabalho:**
1. Comece na coluna 1 (números de casa) - transcreva todos os números de casa de cima para baixo
2. O sistema move-se automaticamente para a coluna 2 - transcreva todos os valores na coluna 2
3. Continue coluna por coluna até chegar à última coluna
4. O formulário está completo!

### Atalhos de Teclado

**Navegação:**
- **Teclas de Seta (↑↓←→)** - Mover entre células
- **Enter** - Guardar e mover para a linha seguinte
- **Espaço** - Alternar sobreposição (mostrar/esconder todos os valores transcritos)

**Entrada Rápida de Dados (Coluna por Coluna):**
- **0-9** - Para colunas de números, avança automaticamente para a linha seguinte **na mesma coluna**
  - Para números ≥10: pressione o primeiro dígito, pressione ←, depois digite o segundo dígito
- **Letras (a-z)** - Para colunas suspensas (tipos de parede/chão/tecto), autocompletar digitando
  - Exemplo: Digite "c" depois "a" para autocompletar "Caniço"
  - O sistema avança automaticamente para a linha seguinte quando apenas uma correspondência permanece

**Funções Especiais:**
- **X** (maiúsculo) - Limpar toda a coluna actual e voltar ao topo dessa coluna
- **Shift+Símbolo** - Digite o número subjacente (Shift+! = 1, Shift+@ = 2, etc.)

### Botões de Acção

- **? Ajuda** - Abrir o modal de ajuda de atalhos de teclado
- **Submeter transcrição** - Guardar o seu trabalho (faça isto periodicamente!)
- **Marcar transcrição como completa** - Marcar este documento como concluído
- **Tentar corrigir colunas** - Auto-detectar limites de coluna (útil se as colunas estiverem desalinhadas)
- **Tentar corrigir linhas** - Auto-detectar limites de linha (útil se as linhas estiverem desalinhadas)
- **Tentar transcrição automática** - Usar OCR para transcrever automaticamente (reveja os resultados cuidadosamente!)

### Dicas

- **Trabalhe coluna por coluna** - Não salte; complete cada coluna de cima para baixo
- **Guarde frequentemente** - Clique em "Submeter transcrição" a cada poucas colunas
- **Alterne a sobreposição** - Pressione Espaço para verificar o seu trabalho contra a imagem
- **Detecção de padrões** - Para colunas de latitude/longitude, o sistema preencherá automaticamente prefixos após inserir a primeira célula
- **Mudança de coluna** - Quando terminar uma coluna, o sistema move-se automaticamente para o topo da coluna seguinte
- **Concentre-se na velocidade** - Os atalhos foram concebidos para entrada vertical rápida; confie no sistema para avançar automaticamente

### Optimização do Fluxo de Trabalho

1. **Comece com a coluna 1** (números de casa) - transcreva todas as linhas de cima para baixo
2. **Passe para a coluna 2** - o sistema passa automaticamente quando chega ao fundo
3. **Continue coluna por coluna** - complete cada coluna inteira antes de passar para a seguinte
4. Para colunas de números: deixe o avanço automático de dígito único funcionar para si (apenas digite e move-se para baixo)
5. Para colunas de parede/chão/tecto: aprenda os prefixos de letras para valores comuns (por exemplo, "ca" para Caniço)
6. Alterne a sobreposição (Espaço) periodicamente para verificar a precisão de toda a coluna
7. Guarde após completar cada 2-3 colunas

### Problemas Comuns

- **Coluna errada?** Use as teclas de seta para navegar, não cliques do rato
- **Colunas desalinhadas?** Tente o botão "Tentar corrigir colunas"
- **OCR cometeu erros?** A transcrição automática é um ponto de partida; sempre reveja
- **Perdeu o seu lugar?** Pressione Espaço para mostrar a sobreposição com todos os valores inseridos

---

## Perguntas ou Problemas?

- Clique no botão **? Ajuda** no separador de Transcrição para referência rápida de atalhos de teclado
- A aplicação guarda automaticamente periodicamente, mas os salvamentos manuais são recomendados
- Cada documento deve passar por todos os três separadores para ser marcado como completo
