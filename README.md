# 🔄 Robackup

Uma interface gráfica moderna e funcional para o utilitário **robocopy.exe** do Windows.

![Badge](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)
![Badge](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Badge](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## ✨ Características

- 🎨 **Design Moderno** - Tema escuro com efeitos glassmorphism
- ⚙️ **86 Opções** - Todas as flags do robocopy organizadas em seções
- 🔄 **Preview em Tempo Real** - Veja o comando sendo construído
- 📺 **Terminal Integrado** - Saída em tempo real com cores
- 💾 **Perfis Salvos** - Salve e reutilize suas configurações
- ⚡ **Presets Rápidos** - Configurações prontas para uso
- 🛡️ **Modo Simulação** - Teste sem executar (ativo por padrão)
- 📚 **Ajuda Integrada** - Descrições detalhadas de cada opção

## 📸 Screenshot

```
┌─────────────────────────────────────────────────────────────┐
│  🔄 ROBACKUP                              [Min][Max][Close] │
├────────┬────────────────────────────────────────────────────┤
│        │  ┌─────────────────────────────────────────────┐  │
│ 📁     │  │  Origem:  [________________________] [📂]   │  │
│ Paths  │  │  Destino: [________________________] [📂]   │  │
│        │  └─────────────────────────────────────────────┘  │
├────────┤                                                    │
│ 📋     │  ┌─────────────────────────────────────────────┐  │
│ Copy   │  │  COMMAND PREVIEW                            │  │
│        │  │  robocopy "C:\..." "D:\..." /E /MIR         │  │
├────────┤  └─────────────────────────────────────────────┘  │
│ 🔍     │  ┌─────────────────────────────────────────────┐  │
│ Filter │  │  OUTPUT TERMINAL                            │  │
│        │  │  > Copying files...                         │  │
└────────┴──┴─────────────────────────────────────────────┴──┘
```

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Windows (robocopy é nativo do Windows)

### Desenvolvimento

```bash
# Clone o repositório
git clone https://github.com/osbarcelos79/robackup.git
cd robackup/robackup-app

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run electron:dev
```

### Build para Produção

```bash
# Gerar executável Windows
npm run electron:build:win
```

O instalador será gerado em `release/`

## 📚 Uso

1. **Selecione as pastas** - Escolha origem e destino
2. **Configure as opções** - Use as seções do sidebar
3. **Verifique o comando** - Veja o preview em tempo real
4. **Execute** - Clique em "Executar Backup"

> ⚠️ **Dica**: O modo simulação vem ativo por padrão. Desative-o apenas quando estiver pronto para executar o backup real.

## 📁 Estrutura

```
robackup-app/
├── electron/           # Processo Electron
│   ├── main.js
│   └── preload.js
├── src/                # Frontend React
│   ├── App.jsx
│   ├── index.css
│   └── data/
│       └── robocopyOptions.js
├── public/
├── package.json
└── vite.config.js
```

## ⚙️ Opções Suportadas

| Categoria | Opções |
|-----------|--------|
| Cópia | /S, /E, /Z, /B, /MIR, /MT, etc. |
| Seleção | /XF, /XD, /MAX, /MIN, /MAXAGE, etc. |
| Retry | /R, /W, /LFSM, etc. |
| Logging | /L, /LOG, /V, /TEE, etc. |
| Jobs | /JOB, /SAVE, etc. |

## 📊 Códigos de Saída

| Código | Status | Significado |
|--------|--------|-------------|
| 0-3 | ✅ Sucesso | Arquivos copiados/sincronizados |
| 4-7 | ⚠️ Aviso | Diferenças detectadas |
| 8+ | ❌ Erro | Falha na cópia |

## 🛠️ Tecnologias

- **Electron** - Framework desktop
- **React** - UI library
- **Vite** - Build tool
- **Lucide** - Ícones
- **CSS** - Glassmorphism design

## 📄 Licença

MIT License - Sinta-se livre para usar e modificar!

---

Feito com ❤️ para facilitar backups no Windows
