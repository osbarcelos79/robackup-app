# 📦 Guia de Build - Robackup

Este documento descreve como empacotar o Robackup em um executável Windows.

## Pré-requisitos

- Node.js 18+
- npm

## Comandos de Build

### Desenvolvimento
```bash
npm run electron:dev
```
Executa a aplicação em modo desenvolvimento com hot-reload.

### Build do Executável (Recomendado)
```bash
npm run package
```
Este comando:
1. Compila o frontend React com Vite
2. Empacota tudo com electron-packager
3. Gera a pasta `release/Robackup-win32-x64/`

### Resultado

Após o build, você encontrará:
```
release/
└── Robackup-win32-x64/
    ├── Robackup.exe        # Executável principal (~213 MB)
    ├── resources/          # Recursos da aplicação
    ├── locales/            # Arquivos de idioma
    └── [outros arquivos DLL e recursos do Electron]
```

## Distribuição

### Opção 1: Pasta Completa (Mais Simples)
Copie toda a pasta `Robackup-win32-x64` para o destino.

**Estrutura mínima necessária:**
- `Robackup.exe`
- `resources/`
- Todos os arquivos `.dll`
- `locales/`
- Arquivos `.pak`

### Opção 2: Criar um ZIP
```bash
# PowerShell
Compress-Archive -Path "release\Robackup-win32-x64\*" -DestinationPath "release\Robackup-v1.0.0-win64.zip"
```

### Opção 3: Criar Instalador NSIS (Avançado)
Use electron-builder com configuração específica (requer mais setup).

## Tamanho do Executável

| Componente | Tamanho |
|------------|---------|
| Robackup.exe | ~213 MB |
| Pasta Total | ~290 MB |
| ZIP comprimido | ~110 MB |

> **Nota:** O tamanho é grande porque inclui o Chromium e Node.js completos (necessários para Electron).

## Primeira Execução

1. Execute `Robackup.exe`
2. O Windows pode mostrar aviso de SmartScreen (clique em "Mais informações" > "Executar assim mesmo")
3. A aplicação iniciará com o modo simulação ativo por padrão

## Troubleshooting

### Erro: "Unable to find Electron"
```bash
npm install electron --save-dev
```

### Erro ao executar
Certifique-se de que todos os arquivos DLL estão na mesma pasta do executável.

### Aplicação não abre
Verifique se o antivírus não está bloqueando. Adicione exceção se necessário.

---

## Scripts npm Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia Vite dev server |
| `npm run build` | Compila frontend |
| `npm run electron:dev` | Desenvolvimento com Electron |
| `npm run package` | **Gera executável Windows** |
