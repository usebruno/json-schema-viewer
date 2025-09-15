import React, { useState, useCallback, useEffect } from 'react';
import { Upload, FileJson, Download, Copy, Check, AlertCircle, Code, Network } from 'lucide-react';
import MonacoEditor from '@monaco-editor/react';
import SchemaExplorer from './SchemaExplorer';
import SchemaGraph from './SchemaGraph';
import { parseSchema } from '../utils/schemaParser';
import opencollectionSchema from '../schemas/opencollection.schema.json';

const SchemaViewer = () => {
  const [schema, setSchema] = useState(null);
  const [parsedSchema, setParsedSchema] = useState(null);
  const [view, setView] = useState('explorer'); // 'explorer', 'visualize', or 'source'
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [jsonInput, setJsonInput] = useState('');



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
    try {
      setSchema(opencollectionSchema);
      setJsonInput(JSON.stringify(opencollectionSchema, null, 2));
      setError(null);
    } catch (err) {
      setError('Failed to load opencollection schema');
    }
  }, []);

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