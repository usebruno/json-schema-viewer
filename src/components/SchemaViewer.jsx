import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, FileJson, Download, Copy, Check, AlertCircle, Code, Network, ChevronDown } from 'lucide-react';
import MonacoEditor from '@monaco-editor/react';
import SchemaExplorer from './SchemaExplorer';
import SchemaGraph from './SchemaGraph';
import { parseSchema } from '../utils/schemaParser';

const SchemaViewer = () => {
  const [schema, setSchema] = useState(null);
  const [parsedSchema, setParsedSchema] = useState(null);
  const [view, setView] = useState('explorer'); // 'explorer', 'visualize', or 'source'
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [showSampleDropdown, setShowSampleDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const sampleSchemas = [
    {
      id: 'opencollection',
      name: 'OpenCollection Schema',
      description: 'Simple collection schema',
      path: '/src/schemas/opencollection.schema.json'
    },
    {
      id: 'sample',
      name: 'Sample Collection Schema',
      description: 'Sample collection schema',
      path: '/src/schemas/sample.schema.json'
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSampleDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target.result);
          setSchema(content);
          setJsonInput(JSON.stringify(content, null, 2));
          setError(null);
        } catch (err) {
          setError('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const handleJsonInput = useCallback((value) => {
    setJsonInput(value);
    try {
      if (value.trim()) {
        const parsed = JSON.parse(value);
        setSchema(parsed);
        setError(null);
      }
    } catch (err) {
      setError('Invalid JSON format');
    }
  }, []);

  const handleUrlLoad = useCallback(async () => {
    const url = prompt('Enter JSON Schema URL:');
    if (url) {
      try {
        const response = await fetch(url);
        const data = await response.json();
        setSchema(data);
        setJsonInput(JSON.stringify(data, null, 2));
        setError(null);
      } catch (err) {
        setError('Failed to load schema from URL');
      }
    }
  }, []);

  const handleExport = useCallback(() => {
    if (schema) {
      const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'schema.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [schema]);

  const handleCopy = useCallback(() => {
    if (schema) {
      navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [schema]);

  const loadExample = useCallback(async (schemaPath) => {
    try {
      const response = await fetch(schemaPath);
      const data = await response.json();
      setSchema(data);
      setJsonInput(JSON.stringify(data, null, 2));
      setError(null);
      setShowSampleDropdown(false);
    } catch (err) {
      setError('Failed to load example schema');
    }
  }, []);

  useEffect(() => {
    if (schema) {
      try {
        const parsed = parseSchema(schema);
        setParsedSchema(parsed);
      } catch (err) {
        setError('Failed to parse schema');
      }
    }
  }, [schema]);

  // Load opencollection schema by default on first mount
  useEffect(() => {
    loadExample('/src/schemas/opencollection.schema.json');
  }, [loadExample]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <FileJson className="w-6 h-6 text-blue-500" />
              JSON Schema Viewer
            </h1>
            
            <div className="flex items-center gap-2">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowSampleDropdown(!showSampleDropdown)}
                  className="px-3 py-1.5 text-base bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  Load Example
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSampleDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showSampleDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[250px]">
                    {sampleSchemas.map((sample) => (
                      <button
                        key={sample.id}
                        onClick={() => loadExample(sample.path)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{sample.name}</div>
                        <div className="text-sm text-gray-500">{sample.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <label className="px-3 py-1.5 text-base bg-blue-500 text-white hover:bg-blue-600 rounded-lg cursor-pointer transition-colors">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-4 h-4 inline mr-1" />
                Upload
              </label>
              
              <button
                onClick={handleUrlLoad}
                className="px-3 py-1.5 text-base bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors"
              >
                Load URL
              </button>
              
              {schema && (
                <>
                  <div className="flex gap-1 mx-2">
                    <button
                      onClick={() => setView('explorer')}
                      className={`px-3 py-1.5 text-base rounded-lg transition-colors ${
                        view === 'explorer'
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      Explorer
                    </button>
                    <button
                      onClick={() => setView('visualize')}
                      className={`px-3 py-1.5 text-base rounded-lg transition-colors ${
                        view === 'visualize'
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      <Network className="w-4 h-4 inline mr-1" />
                      Visualize
                    </button>
                    <button
                      onClick={() => setView('source')}
                      className={`px-3 py-1.5 text-base rounded-lg transition-colors ${
                        view === 'source'
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      <Code className="w-4 h-4 inline mr-1" />
                      Source
                    </button>
                  </div>
                  
                  <button
                    onClick={handleExport}
                    className="px-3 py-1.5 text-base bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4 inline mr-1" />
                    Export
                  </button>
                  
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1.5 text-base bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 inline mr-1 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 inline mr-1" />
                    )}
                    Copy
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-base text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {!schema ? (
          <div className="flex-1 flex">
            <div className="flex-1 p-4">
              <div className="h-full">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold mb-2">Paste JSON Schema</h2>
                  <p className="text-base text-gray-600 mb-4">
                    Upload a file, load from URL, or paste your JSON Schema below
                  </p>
                </div>
                <MonacoEditor
                  height="calc(100% - 100px)"
                  language="json"
                  theme="vs-dark"
                  value={jsonInput}
                  onChange={handleJsonInput}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 16,
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden min-w-0">
            {view === 'explorer' ? (
              <SchemaExplorer schema={schema} rootSchema={schema} />
            ) : view === 'visualize' ? (
              <SchemaGraph schema={schema} rootSchema={schema} />
            ) : (
              <div className="flex-1 p-4">
                <MonacoEditor
                  height="100%"
                  language="json"
                  theme="vs-dark"
                  value={JSON.stringify(schema, null, 2)}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 16,
                    wordWrap: 'on',
                    automaticLayout: true,
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemaViewer;