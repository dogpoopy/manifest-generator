import React, { useState, useCallback, useEffect } from 'react';
import { Plus, Trash2, Copy, Download, Play, ExternalLink } from 'lucide-react';

export default function ManifestGenerator() {
  const [remotes, setRemotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [removeProjects, setRemoveProjects] = useState([]);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [romManifest, setRomManifest] = useState('');
  const [romBranch, setRomBranch] = useState('');
  const [interactiveManifest, setInteractiveManifest] = useState('');

  // Generate XML
  const generateManifest = useCallback(() => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<manifest>\n\n';
    
    if (remotes.length > 0) {
      xml += '  <!-- Remotes -->\n';
      remotes.forEach(remote => {
        if (remote.name && remote.fetch) {
          xml += `  <remote name="${remote.name}" fetch="${remote.fetch}" />\n`;
        }
      });
      xml += '\n';
    }

    if (removeProjects.length > 0) {
      xml += '  <!-- Remove Projects -->\n';
      removeProjects.forEach(rp => {
        if (rp.path) {
          xml += `  <remove-project path="${rp.path}" />\n`;
        }
      });
      xml += '\n';
    }

    if (projects.length > 0) {
      xml += '  <!-- Projects -->\n';
      projects.forEach(project => {
        if (project.path && project.name) {
          let line = `  <project path="${project.path}"\n`;
          line += `           name="${project.name}"`;
          if (project.remote) {
            line += `\n           remote="${project.remote}"`;
          }
          if (project.branch) {
            line += `\n           revision="${project.branch}"`;
          }
          if (project.shallowClone) {
            line += `\n           clone-depth="1"`;
          }
          line += ' />';
          
          xml += project.commented ? `  <!--\n${line}\n  -->\n` : `${line}\n`;
        }
      });
    }

    xml += '\n</manifest>';
    return xml;
  }, [remotes, projects, removeProjects]);

  useEffect(() => {
    setInteractiveManifest(generateManifest());
  }, [generateManifest]);

  // Remotes handlers
  const addRemote = useCallback(() => {
    setRemotes([...remotes, { name: '', fetch: '' }]);
  }, [remotes]);

  const updateRemote = useCallback((index, field, value) => {
    const updated = [...remotes];
    updated[index][field] = value;
    setRemotes(updated);
  }, [remotes]);

  const deleteRemote = useCallback((index) => {
    setRemotes(remotes.filter((_, i) => i !== index));
  }, [remotes]);

  // Projects handlers
  const addProject = useCallback(() => {
    setProjects([...projects, { path: '', name: '', remote: '', branch: '', commented: false, shallowClone: false }]);
  }, [projects]);

  const updateProject = useCallback((index, field, value) => {
    const updated = [...projects];
    updated[index][field] = value;
    setProjects(updated);
  }, [projects]);

  const deleteProject = useCallback((index) => {
    setProjects(projects.filter((_, i) => i !== index));
  }, [projects]);

  // Remove Projects handlers
  const addRemoveProject = useCallback(() => {
    setRemoveProjects([...removeProjects, { path: '' }]);
  }, [removeProjects]);

  const updateRemoveProject = useCallback((index, value) => {
    const updated = [...removeProjects];
    updated[index].path = value;
    setRemoveProjects(updated);
  }, [removeProjects]);

  const deleteRemoveProject = useCallback((index) => {
    setRemoveProjects(removeProjects.filter((_, i) => i !== index));
  }, [removeProjects]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateManifest());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadManifest = () => {
    const element = document.createElement('a');
    const file = new Blob([generateManifest()], { type: 'text/xml' });
    element.href = URL.createObjectURL(file);
    element.download = 'local_manifest.xml';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const testManifest = async () => {
    if (!romManifest || !romBranch) {
      alert('Please enter ROM manifest and branch');
      return;
    }

    const manifest = interactiveManifest.trim();
    
    if (!manifest || (!manifest.includes('<project') && !manifest.includes('<remove-project'))) {
      alert('Please add at least one project to test');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/trigger-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          romManifest,
          romBranch,
          manifestContent: manifest
        })
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: 'Test started successfully! The workflow will verify repository accessibility and manifest validity.',
          runUrl: data.runUrl,
          workflowUrl: data.workflowUrl,
          runId: data.runId
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to start test'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Network error: ' + error.message
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Manifest Generator</h1>
          <p className="text-gray-400 mt-2">Create and test local_manifest.xml for ROM building</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6 order-2 lg:order-1">
            {/* Remotes Section */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-white">Remotes</h2>
                <button onClick={addRemote} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition">
                  <Plus size={16} /> Add Remote
                </button>
              </div>
              <p className="text-gray-400 text-sm mb-3">Define git remotes for your projects</p>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {remotes.map((remote, idx) => (
                  <div key={idx} className="bg-gray-900 p-3 rounded space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-300 text-sm">Remote {idx + 1}</span>
                      <button onClick={() => deleteRemote(idx)} className="text-red-400 hover:text-red-300 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Name (e.g., remote1)"
                      value={remote.name}
                      onChange={(e) => updateRemote(idx, 'name', e.target.value)}
                      className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Fetch URL (e.g., https://github.com/your_username)"
                      value={remote.fetch}
                      onChange={(e) => updateRemote(idx, 'fetch', e.target.value)}
                      className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Projects Section */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-white">Projects</h2>
                <button onClick={addProject} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition">
                  <Plus size={16} /> Add Project
                </button>
              </div>
              <p className="text-gray-400 text-sm mb-3">Add device, vendor, kernel, and other repositories</p>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {projects.map((project, idx) => (
                  <div key={idx} className="bg-gray-900 p-3 rounded space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-green-300 text-sm">Project {idx + 1}</span>
                      <button onClick={() => deleteProject(idx)} className="text-red-400 hover:text-red-300 transition">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Path (e.g., device/xiaomi/apollo)"
                      value={project.path}
                      onChange={(e) => updateProject(idx, 'path', e.target.value)}
                      className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-green-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Name (must match project name in remote"
                      value={project.name}
                      onChange={(e) => updateProject(idx, 'name', e.target.value)}
                      className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-green-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Remote (must match a remote name above)"
                      value={project.remote}
                      onChange={(e) => updateProject(idx, 'remote', e.target.value)}
                      className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-green-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Branch (must match branch in remote)"
                      value={project.branch}
                      onChange={(e) => updateProject(idx, 'branch', e.target.value)}
                      className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-green-500 focus:outline-none"
                    />
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={project.shallowClone}
                          onChange={(e) => updateProject(idx, 'shallowClone', e.target.checked)}
                          className="w-3 h-3"
                        />
                        Shallow clone
                      </label>
                      <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={project.commented}
                          onChange={(e) => updateProject(idx, 'commented', e.target.checked)}
                          className="w-3 h-3"
                        />
                        Comment out (disable)
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Remove Projects Section */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-white">Remove Projects</h2>
                <button onClick={addRemoveProject} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition">
                  <Plus size={16} /> Add to Remove
                </button>
              </div>
              <p className="text-gray-400 text-sm mb-3">Projects to remove from the ROM source</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {removeProjects.map((rp, idx) => (
                  <div key={idx} className="bg-gray-900 p-2 rounded flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Project path (e.g., hardware/xiaomi)"
                      value={rp.path}
                      onChange={(e) => updateRemoveProject(idx, e.target.value)}
                      className="flex-1 bg-gray-800 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-red-500 focus:outline-none"
                    />
                    <button onClick={() => deleteRemoveProject(idx)} className="text-red-400 hover:text-red-300 p-1 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Section */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-3">Test Your Manifest</h2>
              <div className="bg-gray-900 border border-gray-600 rounded p-3 mb-3">
                <p className="text-gray-300 text-sm mb-2">
                  <strong>What this test does:</strong>
                </p>
                <ul className="text-gray-400 text-xs space-y-1 ml-4 list-disc">
                  <li>Validates XML syntax with the ROM manifest</li>
                  <li>Verifies each repository URL is accessible</li>
                  <li>Checks if branch/revision exists in each repository</li>
                </ul>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="ROM manifest URL (e.g., https://github.com/LineageOS/android.git)"
                  value={romManifest}
                  onChange={(e) => setRomManifest(e.target.value)}
                  className="w-full bg-gray-900 text-white px-3 py-2 rounded text-sm border border-gray-600 focus:border-yellow-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="ROM Branch (e.g., lineage-21.0)"
                  value={romBranch}
                  onChange={(e) => setRomBranch(e.target.value)}
                  className="w-full bg-gray-900 text-white px-3 py-2 rounded text-sm border border-gray-600 focus:border-yellow-500 focus:outline-none"
                />
                
                {/* Interactive Manifest Area */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-300 text-sm font-medium">Manifest Content</label>
                    <button
                      onClick={() => setInteractiveManifest(generateManifest())}
                      className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 transition"
                    >
                      <Copy size={12} /> Reset to Generated
                    </button>
                  </div>
                  <textarea
                    value={interactiveManifest}
                    onChange={(e) => setInteractiveManifest(e.target.value)}
                    placeholder="Paste your manifest here or use the generated one above..."
                    className="w-full bg-black text-green-400 px-3 py-2 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none font-mono text-xs h-48 lg:h-64 resize-none overflow-x-auto whitespace-pre"
                    wrap="off"
                  />
                  <p className="text-gray-500 text-xs mt-1">
                    💡 Edit this content directly, or paste your existing manifest here to test it
                  </p>
                </div>

                <button
                  onClick={testManifest}
                  disabled={testing}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded transition"
                >
                  {testing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Starting Test...
                    </>
                  ) : (
                    <>
                      <Play size={18} /> Test Manifest
                    </>
                  )}
                </button>
              </div>
              
              {testResult && (
                <div className={`mt-3 p-3 rounded ${testResult.success ? 'bg-green-900/50 border border-green-600' : 'bg-red-900/50 border border-red-600'}`}>
                  <p className="text-white text-sm mb-2">{testResult.message}</p>
                  {testResult.success && (
                    <div className="space-y-2">
                      {testResult.runUrl && (
                        <a
                          href={testResult.runUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm transition"
                        >
                          <ExternalLink size={14} />
                          View Your Test Run
                        </a>
                      )}
                      {!testResult.runUrl && testResult.workflowUrl && (
                        <a
                          href={testResult.workflowUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200 text-sm"
                        >
                          View All Test Runs →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-4 order-1 lg:order-2">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 h-full">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold text-white">Generated Manifest</h2>
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm transition"
                  >
                    <Copy size={16} /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={downloadManifest}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition"
                  >
                    <Download size={16} /> Download
                  </button>
                </div>
              </div>
              <pre className="bg-black text-green-400 p-3 rounded overflow-x-auto text-sm font-mono h-64 lg:h-[calc(100vh-12rem)] overflow-y-auto border border-gray-600">
                {generateManifest()}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
