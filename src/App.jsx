import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FolderSync,
  Minus,
  Square,
  X,
  FolderOpen,
  FolderInput,
  Copy,
  Filter,
  RotateCcw,
  FileText,
  Briefcase,
  Settings,
  HelpCircle,
  Play,
  StopCircle,
  Save,
  FolderUp,
  ChevronDown,
  Check,
  AlertTriangle,
  Terminal,
  Zap,
  Shield,
  Clock,
  Info,
  Trash2,
  Upload,
  ExternalLink,
} from 'lucide-react';

import {
  copyOptions,
  fileSelectionOptions,
  retryOptions,
  loggingOptions,
  jobOptions,
  otherOptions,
  presets,
  exitCodes,
  defaultExclusions,
} from './data/robocopyOptions';

import './index.css';

// Sidebar navigation items
const navItems = [
  { id: 'paths', icon: FolderOpen, label: 'Origem e Destino' },
  { id: 'copy', icon: Copy, label: 'Opções de Cópia' },
  { id: 'selection', icon: Filter, label: 'Seleção de Arquivos' },
  { id: 'retry', icon: RotateCcw, label: 'Retentativas' },
  { id: 'logging', icon: FileText, label: 'Logging' },
  { id: 'job', icon: Briefcase, label: 'Jobs e Perfis' },
  { id: 'other', icon: Settings, label: 'Outras Opções' },
];

function App() {
  // Active section
  const [activeSection, setActiveSection] = useState('paths');

  // Paths
  const [sourcePath, setSourcePath] = useState('');
  const [destPath, setDestPath] = useState('');

  // Options state
  const [options, setOptions] = useState({});
  const [textOptions, setTextOptions] = useState({
    '/XF': '',
    '/XD': '',
    '/IF': '',
  });

  // Terminal
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastExitCode, setLastExitCode] = useState(null);
  const terminalRef = useRef(null);

  // Profiles
  const [profiles, setProfiles] = useState([]);
  const [profileName, setProfileName] = useState('');

  // Help modal
  const [showHelp, setShowHelp] = useState(false);

  // Simulation mode
  const [simulationMode, setSimulationMode] = useState(true);

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  // Setup robocopy event listeners
  useEffect(() => {
    if (!window.electronAPI) return;

    const removeOutputListener = window.electronAPI.onRobocopyOutput((data) => {
      setOutput((prev) => [...prev, { type: data.type, text: data.data }]);
    });

    const removeCompleteListener = window.electronAPI.onRobocopyComplete((data) => {
      setIsRunning(false);
      setLastExitCode(data.code);
      const exitInfo = exitCodes[data.code] || { status: 'info', message: `Código de saída: ${data.code}` };
      setOutput((prev) => [
        ...prev,
        { type: exitInfo.status, text: `\n--- Concluído com código ${data.code}: ${exitInfo.message} ---\n` },
      ]);
    });

    const removeErrorListener = window.electronAPI.onRobocopyError((error) => {
      setIsRunning(false);
      setOutput((prev) => [...prev, { type: 'error', text: `Erro: ${error}` }]);
    });

    return () => {
      removeOutputListener();
      removeCompleteListener();
      removeErrorListener();
    };
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  const loadProfiles = async () => {
    if (window.electronAPI) {
      const profileList = await window.electronAPI.getProfiles();
      setProfiles(profileList);
    }
  };

  const selectFolder = async (setter) => {
    if (window.electronAPI) {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        setter(folder);
      }
    }
  };

  const toggleOption = (flag) => {
    setOptions((prev) => ({
      ...prev,
      [flag]: !prev[flag],
    }));
  };

  const setOptionValue = (flag, value) => {
    setOptions((prev) => ({
      ...prev,
      [flag]: value,
    }));
  };

  const setTextOption = (flag, value) => {
    setTextOptions((prev) => ({
      ...prev,
      [flag]: value,
    }));
  };

  // Build command arguments
  const buildCommand = useCallback(() => {
    const args = [];

    if (sourcePath) args.push(`"${sourcePath}"`);
    if (destPath) args.push(`"${destPath}"`);

    // Add simulation mode if enabled
    if (simulationMode && !options['/L']) {
      args.push('/L');
    }

    // Process all options
    Object.entries(options).forEach(([flag, value]) => {
      if (value === true) {
        args.push(flag);
      } else if (value && typeof value === 'string' && value.trim()) {
        if (flag === '/COPY' || flag === '/DCOPY' || flag === '/A+' || flag === '/A-' || flag === '/IA' || flag === '/XA') {
          args.push(`${flag}:${value}`);
        } else if (flag.includes(':')) {
          args.push(`${flag.split(':')[0]}:${value}`);
        } else {
          args.push(`${flag}:${value}`);
        }
      } else if (typeof value === 'number' && value > 0) {
        args.push(`${flag}:${value}`);
      }
    });

    // Process text options (XF, XD, IF)
    Object.entries(textOptions).forEach(([flag, value]) => {
      if (value && value.trim()) {
        const items = value.split('\n').filter((item) => item.trim());
        items.forEach((item) => {
          args.push(flag);
          args.push(`"${item.trim()}"`);
        });
      }
    });

    return args;
  }, [sourcePath, destPath, options, textOptions, simulationMode]);

  const getCommandPreview = () => {
    const args = buildCommand();
    return `robocopy ${args.join(' ')}`;
  };

  const executeCommand = async () => {
    if (!sourcePath || !destPath) {
      setOutput([{ type: 'error', text: 'Erro: Selecione os diretórios de origem e destino.' }]);
      return;
    }

    setOutput([{ type: 'info', text: `> Executando: robocopy ${buildCommand().join(' ')}\n` }]);
    setIsRunning(true);
    setLastExitCode(null);

    try {
      const args = buildCommand();
      // Remove quotes from args for spawn
      const cleanArgs = args.map((arg) => arg.replace(/^"|"$/g, ''));
      await window.electronAPI.executeRobocopy(cleanArgs);
    } catch (error) {
      setIsRunning(false);
      setOutput((prev) => [...prev, { type: 'error', text: `Erro ao executar: ${error.message}` }]);
    }
  };

  const cancelCommand = async () => {
    if (window.electronAPI) {
      await window.electronAPI.cancelRobocopy();
      setIsRunning(false);
      setOutput((prev) => [...prev, { type: 'warning', text: '\n--- Operação cancelada pelo usuário ---\n' }]);
    }
  };

  const copyCommand = () => {
    navigator.clipboard.writeText(getCommandPreview());
  };

  const clearOutput = () => {
    setOutput([]);
    setLastExitCode(null);
  };

  const saveProfile = async () => {
    if (!profileName.trim()) return;

    const config = {
      sourcePath,
      destPath,
      options,
      textOptions,
      simulationMode,
    };

    if (window.electronAPI) {
      await window.electronAPI.saveProfile(profileName, config);
      await loadProfiles();
      setProfileName('');
    }
  };

  const loadProfile = async (name) => {
    if (window.electronAPI) {
      const config = await window.electronAPI.loadProfile(name);
      if (config) {
        setSourcePath(config.sourcePath || '');
        setDestPath(config.destPath || '');
        setOptions(config.options || {});
        setTextOptions(config.textOptions || { '/XF': '', '/XD': '', '/IF': '' });
        setSimulationMode(config.simulationMode ?? true);
      }
    }
  };

  const deleteProfile = async (name) => {
    if (window.electronAPI) {
      await window.electronAPI.deleteProfile(name);
      await loadProfiles();
    }
  };

  const applyPreset = (preset) => {
    setOptions((prev) => ({
      ...prev,
      ...preset.options,
    }));
  };

  const applyDefaultExclusions = () => {
    setTextOptions((prev) => ({
      ...prev,
      '/XF': defaultExclusions.files.join('\n'),
      '/XD': defaultExclusions.folders.join('\n'),
    }));
  };

  // Render option based on type
  const renderOption = (opt) => {
    const isActive = options[opt.flag];
    const value = options[opt.flag];

    switch (opt.type) {
      case 'toggle':
        return (
          <div
            key={opt.flag}
            className={`toggle-option ${isActive ? 'active' : ''} ${opt.warning ? 'warning' : ''}`}
            onClick={() => toggleOption(opt.flag)}
          >
            <div className="toggle-option-content">
              <div className="toggle-option-label">
                <span className="toggle-option-flag">{opt.flag}</span>
                {opt.label}
                {opt.warning && <AlertTriangle size={14} color="var(--accent-yellow)" />}
              </div>
              <div className="toggle-option-desc">{opt.description}</div>
            </div>
            <div className="toggle-switch"></div>
          </div>
        );

      case 'number':
        return (
          <div key={opt.flag} className="input-group" style={{ gridColumn: 'span 1' }}>
            <label className="input-label">
              <span className="toggle-option-flag">{opt.flag}</span> {opt.label}
            </label>
            <input
              type="number"
              className="input-field"
              placeholder={opt.placeholder}
              value={value || ''}
              min={opt.min}
              max={opt.max}
              onChange={(e) => setOptionValue(opt.flag, e.target.value ? parseInt(e.target.value) : '')}
            />
            <span className="toggle-option-desc" style={{ marginTop: 4 }}>{opt.description}</span>
          </div>
        );

      case 'text':
      case 'size':
        return (
          <div key={opt.flag} className="input-group" style={{ gridColumn: 'span 1' }}>
            <label className="input-label">
              <span className="toggle-option-flag">{opt.flag}</span> {opt.label}
            </label>
            <input
              type="text"
              className="input-field"
              placeholder={opt.placeholder}
              value={value || ''}
              onChange={(e) => setOptionValue(opt.flag, e.target.value)}
            />
            <span className="toggle-option-desc" style={{ marginTop: 4 }}>{opt.description}</span>
          </div>
        );

      case 'textarea':
        return (
          <div key={opt.flag} className="input-group" style={{ gridColumn: 'span 2' }}>
            <label className="input-label">
              <span className="toggle-option-flag">{opt.flag}</span> {opt.label}
            </label>
            <textarea
              className="textarea-field"
              placeholder={opt.placeholder}
              value={textOptions[opt.flag] || ''}
              onChange={(e) => setTextOption(opt.flag, e.target.value)}
              rows={4}
            />
            <span className="toggle-option-desc" style={{ marginTop: 4 }}>{opt.description}</span>
          </div>
        );

      case 'flags':
      case 'attributes':
        return (
          <div key={opt.flag} className="input-group" style={{ gridColumn: 'span 2' }}>
            <label className="input-label">
              <span className="toggle-option-flag">{opt.flag}</span> {opt.label}
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {opt.options.map((char) => {
                const currentValue = value || '';
                const isSelected = currentValue.includes(char);
                return (
                  <button
                    key={char}
                    className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => {
                      const newValue = isSelected
                        ? currentValue.replace(char, '')
                        : currentValue + char;
                      setOptionValue(opt.flag, newValue);
                    }}
                  >
                    {char}
                  </button>
                );
              })}
            </div>
            <span className="toggle-option-desc" style={{ marginTop: 8 }}>{opt.description}</span>
          </div>
        );

      case 'file':
        return (
          <div key={opt.flag} className="input-group" style={{ gridColumn: 'span 2' }}>
            <label className="input-label">
              <span className="toggle-option-flag">{opt.flag}</span> {opt.label}
            </label>
            <div className="path-input-wrapper">
              <input
                type="text"
                className="path-input"
                placeholder={opt.placeholder}
                value={value || ''}
                onChange={(e) => setOptionValue(opt.flag, e.target.value)}
              />
              <button
                className="btn btn-secondary"
                onClick={async () => {
                  if (window.electronAPI) {
                    const file = await window.electronAPI.selectLogFile(true);
                    if (file) setOptionValue(opt.flag, file);
                  }
                }}
              >
                <FolderOpen size={16} />
              </button>
            </div>
            <span className="toggle-option-desc" style={{ marginTop: 4 }}>{opt.description}</span>
          </div>
        );

      default:
        return null;
    }
  };

  // Render section content
  const renderSection = () => {
    switch (activeSection) {
      case 'paths':
        return (
          <div className="fade-in">
            <div className="glass-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <FolderOpen className="panel-title-icon" />
                  Diretórios de Backup
                </div>
              </div>
              <div className="path-selector">
                <div className="path-input-group">
                  <label className="path-label">
                    <FolderUp size={14} className="path-label-icon" />
                    Diretório de Origem
                  </label>
                  <div className="path-input-wrapper">
                    <input
                      type="text"
                      className="path-input"
                      placeholder="C:\Users\Documentos"
                      value={sourcePath}
                      onChange={(e) => setSourcePath(e.target.value)}
                    />
                    <button className="btn btn-secondary" onClick={() => selectFolder(setSourcePath)}>
                      <FolderOpen size={16} />
                    </button>
                    {sourcePath && (
                      <button
                        className="btn btn-ghost"
                        onClick={() => window.electronAPI?.openFolder(sourcePath)}
                        title="Abrir pasta"
                      >
                        <ExternalLink size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="path-input-group">
                  <label className="path-label">
                    <FolderInput size={14} className="path-label-icon" />
                    Diretório de Destino
                  </label>
                  <div className="path-input-wrapper">
                    <input
                      type="text"
                      className="path-input"
                      placeholder="D:\Backup"
                      value={destPath}
                      onChange={(e) => setDestPath(e.target.value)}
                    />
                    <button className="btn btn-secondary" onClick={() => selectFolder(setDestPath)}>
                      <FolderOpen size={16} />
                    </button>
                    {destPath && (
                      <button
                        className="btn btn-ghost"
                        onClick={() => window.electronAPI?.openFolder(destPath)}
                        title="Abrir pasta"
                      >
                        <ExternalLink size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Zap className="panel-title-icon" />
                  Presets Rápidos
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    className="btn btn-secondary"
                    onClick={() => applyPreset(preset)}
                    title={preset.description}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'copy':
        return (
          <div className="fade-in">
            <div className="glass-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Copy className="panel-title-icon" />
                  Opções de Cópia
                </div>
              </div>
              <div className="options-grid">{copyOptions.map(renderOption)}</div>
            </div>
          </div>
        );

      case 'selection':
        return (
          <div className="fade-in">
            <div className="glass-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Filter className="panel-title-icon" />
                  Seleção de Arquivos
                </div>
                <button className="btn btn-sm btn-secondary" onClick={applyDefaultExclusions}>
                  Aplicar Exclusões Padrão
                </button>
              </div>
              <div className="options-grid">{fileSelectionOptions.map(renderOption)}</div>
            </div>
          </div>
        );

      case 'retry':
        return (
          <div className="fade-in">
            <div className="glass-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <RotateCcw className="panel-title-icon" />
                  Opções de Retentativa
                </div>
              </div>
              <div className="options-grid">{retryOptions.map(renderOption)}</div>
            </div>
          </div>
        );

      case 'logging':
        return (
          <div className="fade-in">
            <div className="glass-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <FileText className="panel-title-icon" />
                  Opções de Logging
                </div>
              </div>
              <div className="options-grid">{loggingOptions.map(renderOption)}</div>
            </div>
          </div>
        );

      case 'job':
        return (
          <div className="fade-in">
            <div className="glass-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Briefcase className="panel-title-icon" />
                  Opções de Job
                </div>
              </div>
              <div className="options-grid">{jobOptions.map(renderOption)}</div>
            </div>

            <div className="glass-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Save className="panel-title-icon" />
                  Perfis Salvos
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Nome do perfil"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary" onClick={saveProfile} disabled={!profileName.trim()}>
                  <Save size={16} />
                  Salvar
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {profiles.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhum perfil salvo.</p>
                ) : (
                  profiles.map((name) => (
                    <div key={name} className="profile-card">
                      <div className="profile-card-info">
                        <div className="profile-card-icon">
                          <Briefcase size={18} color="var(--accent-primary)" />
                        </div>
                        <span className="profile-card-name">{name}</span>
                      </div>
                      <div className="profile-card-actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => loadProfile(name)}>
                          <Upload size={14} />
                          Carregar
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => deleteProfile(name)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'other':
        return (
          <div className="fade-in">
            <div className="glass-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Settings className="panel-title-icon" />
                  Outras Opções
                </div>
              </div>
              <div className="options-grid">{otherOptions.map(renderOption)}</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      {/* Title Bar */}
      <div className="title-bar">
        <div className="title-bar-left">
          <div className="title-bar-logo">
            <FolderSync size={16} />
          </div>
          <span className="title-bar-title">ROBACKUP</span>
          <span className="badge badge-info" style={{ marginLeft: 8 }}>
            v1.0
          </span>
        </div>
        <div className="title-bar-controls">
          <button className="title-bar-btn minimize" onClick={() => window.electronAPI?.minimize()} title="Minimizar" />
          <button className="title-bar-btn maximize" onClick={() => window.electronAPI?.maximize()} title="Maximizar" />
          <button className="title-bar-btn close" onClick={() => window.electronAPI?.close()} title="Fechar" />
        </div>
      </div>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Sidebar */}
        <nav className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Configuração</div>
            {navItems.map((item) => (
              <div
                key={item.id}
                className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <item.icon className="sidebar-item-icon" />
                <span className="sidebar-item-label">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="sidebar-divider" />

          <div className="sidebar-section">
            <div className="sidebar-section-title">Ação</div>
            <div
              className="sidebar-item"
              onClick={() => setShowHelp(true)}
            >
              <HelpCircle className="sidebar-item-icon" />
              <span className="sidebar-item-label">Ajuda</span>
            </div>
          </div>

          {/* Quick status */}
          <div style={{ marginTop: 'auto', padding: '16px 20px' }}>
            <div
              className={`toggle-option ${simulationMode ? 'active' : ''}`}
              onClick={() => setSimulationMode(!simulationMode)}
              style={{ marginBottom: 12 }}
            >
              <div className="toggle-option-content">
                <div className="toggle-option-label">
                  <Shield size={14} />
                  Modo Simulação
                </div>
                <div className="toggle-option-desc">Não executa, apenas lista</div>
              </div>
              <div className="toggle-switch"></div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="main-content">
          <div className="content-area">
            {renderSection()}

            {/* Command Preview */}
            <div className="glass-panel">
              <div className="command-preview">
                <div className="command-preview-header">
                  <span className="command-preview-title">Comando</span>
                  <button className="btn btn-ghost btn-sm" onClick={copyCommand} title="Copiar comando">
                    <Copy size={14} />
                  </button>
                </div>
                <div className="command-text">
                  <span className="command-keyword">robocopy</span>{' '}
                  {sourcePath && <span className="command-path">"{sourcePath}"</span>}{' '}
                  {destPath && <span className="command-path">"{destPath}"</span>}{' '}
                  {simulationMode && !options['/L'] && <span className="command-flag">/L</span>}{' '}
                  {Object.entries(options)
                    .filter(([, v]) => v)
                    .map(([flag, value]) => (
                      <span key={flag} className="command-flag">
                        {typeof value === 'boolean' ? flag : `${flag}:${value}`}{' '}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            {/* Terminal */}
            <div className="terminal" style={{ flex: 1 }}>
              <div className="terminal-header">
                <div className="terminal-title">
                  <Terminal size={14} />
                  Saída do Robocopy
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="terminal-status">
                    <div className={`terminal-status-dot ${isRunning ? 'running' : lastExitCode !== null ? (lastExitCode < 8 ? 'success' : 'error') : ''}`} />
                    <span style={{ color: 'var(--text-muted)' }}>
                      {isRunning ? 'Executando...' : lastExitCode !== null ? `Código: ${lastExitCode}` : 'Aguardando'}
                    </span>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={clearOutput}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="terminal-body" ref={terminalRef}>
                {output.length === 0 ? (
                  <span style={{ color: 'var(--text-muted)' }}>
                    A saída do comando aparecerá aqui...
                  </span>
                ) : (
                  output.map((line, i) => (
                    <div key={i} className={`terminal-line ${line.type}`}>
                      {line.text}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="action-bar">
            <div className="action-bar-left">
              {simulationMode && (
                <span className="badge badge-warning">
                  <Shield size={12} />
                  Modo Simulação Ativo
                </span>
              )}
              {!sourcePath && <span className="badge badge-danger">Selecione a origem</span>}
              {!destPath && <span className="badge badge-danger">Selecione o destino</span>}
            </div>
            <div className="action-bar-right">
              {isRunning ? (
                <button className="btn btn-danger btn-lg" onClick={cancelCommand}>
                  <StopCircle size={18} />
                  Cancelar
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={executeCommand}
                  disabled={!sourcePath || !destPath}
                >
                  <Play size={18} />
                  {simulationMode ? 'Simular Backup' : 'Executar Backup'}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Help Modal */}
      <div className={`modal-overlay ${showHelp ? 'open' : ''}`} onClick={() => setShowHelp(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Ajuda do Robackup</h2>
            <button className="btn btn-ghost" onClick={() => setShowHelp(false)}>
              <X size={20} />
            </button>
          </div>
          <div className="modal-body">
            <h3 style={{ marginBottom: 16, color: 'var(--accent-primary)' }}>Bem-vindo ao Robackup!</h3>
            <p style={{ marginBottom: 16, lineHeight: 1.6 }}>
              O Robackup é uma interface gráfica moderna para o utilitário <strong>robocopy.exe</strong> do Windows,
              permitindo criar backups de forma fácil e segura.
            </p>

            <h4 style={{ marginTop: 24, marginBottom: 12 }}>🛡️ Modo Simulação</h4>
            <p style={{ marginBottom: 16, lineHeight: 1.6 }}>
              Por padrão, o modo simulação está ativo. Isso significa que o Robackup irá apenas <em>listar</em> o que
              seria copiado, sem fazer nenhuma alteração. Desative-o quando estiver pronto para executar o backup real.
            </p>

            <h4 style={{ marginTop: 24, marginBottom: 12 }}>⚡ Presets Rápidos</h4>
            <p style={{ marginBottom: 16, lineHeight: 1.6 }}>
              Use os presets para configurar rapidamente opções comuns de backup, como espelhamento, backup incremental
              ou cópia de rede.
            </p>

            <h4 style={{ marginTop: 24, marginBottom: 12 }}>📁 Perfis</h4>
            <p style={{ marginBottom: 16, lineHeight: 1.6 }}>
              Salve suas configurações em perfis para reutilizá-las depois. Acesse a seção "Jobs e Perfis" para
              gerenciar seus perfis salvos.
            </p>

            <h4 style={{ marginTop: 24, marginBottom: 12 }}>⚠️ Opções Perigosas</h4>
            <p style={{ marginBottom: 16, lineHeight: 1.6 }}>
              Opções marcadas com um ícone de alerta (<AlertTriangle size={14} style={{ verticalAlign: 'middle' }} />) podem deletar arquivos.
              Use com cautela e sempre teste primeiro no modo simulação!
            </p>

            <h4 style={{ marginTop: 24, marginBottom: 12 }}>📊 Códigos de Saída</h4>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <p><strong>0-3:</strong> Sucesso (arquivos copiados ou sincronizados)</p>
              <p><strong>4-7:</strong> Avisos (diferenças detectadas)</p>
              <p><strong>8+:</strong> Erros (falhas na cópia)</p>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={() => setShowHelp(false)}>
              Entendi!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
