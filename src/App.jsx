import React, { useState, useCallback } from 'react';
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
    setProjects([...projects, { path: '', name: '', remote: '', branch: '', commented: false }]);
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
    setRemoveProjects([...removeProjects, { name: '' }]);
  }, [removeProjects]);

  const updateRemoveProject = useCallback((index, value) => {
    const updated = [...removeProjects];
    updated[index].name = value;
    setRemoveProjects(updated);
  }, [removeProjects]);

  const deleteRemoveProject = useCallback((index) => {
    setRemoveProjects(removeProjects.filter((_, i) => i !== index));
  }, [removeProjects]);

  // Generate XML
  const generateManifest = () => {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<manifest>\n\n';
    
    if (remotes.length > 0) {
      xml += '  <!-- Remotes -->\n';
      remotes.forEach(remote => {
        if (remote.name && remote.fetch) {
          xml += `  <remote name="${remote.name}"\n`;
          xml += `          fetch="${remote.fetch}" />\n\n`;
        }
      });
    }

    if (projects.length > 0) {
      xml += '  <!-- Projects -->\n';
      projects.forEach(project => {
        if (project.path && project.name) {
          const line = `  <project path="${project.path}" name="${project.name}"${project.remote ? ` remote="${project.remote}"` : ''}${project.branch ? ` revision="${project.branch}"` : ''} />`;
          xml += project.commented ? `  <!--${line} -->\n` : `${line}\n`;
        }
      });
    }

    if (removeProjects.length > 0) {
      xml += '\n  <!-- Remove Projects -->\n';
      removeProjects.forEach(rp => {
        if (rp.name) {
          xml += `  <remove-project name="${rp.name}" />\n`;
        }
      });
    }

    xml += '\n</manifest>';
    return xml;
  };

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

    const manifest = generateManifest();
    
    if (!manifest.includes('<project') && !manifest.includes('<remove-project')) {
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
          {/* Left Column: Inputs */}
          <div className="space-y-6">
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
                      placeholder="Name (e.g., github)"
                      value={remote.name}
                      onChange={(e) => updateRemote(idx, 'name', e.target.value)}
                      className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Fetch URL (e.g., https://github.com/)"
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
                      placeholder="Remote (must match a remote above)"
                      value={project.remote}
                      onChange={(e) => updateProject(idx, 'remote', e.target.value)}
                      className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-green-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Branch (e.g., lineage-21.0)"
                      value={project.branch}
                      onChange={(e) => updateProject(idx, 'branch', e.target.value)}
                      className="w-full bg-gray-800 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-green-500 focus:outline-none"
                    />
                    <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={project.commented}
                        onChange={(e) => updateProject(idx, 'commented', e.target.checked)}
                        className="w-3 h-3"
                      />
                      Comment out (disable in manifest)
                    </label>
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
                      placeholder="Project name (e.g., platform/external/libcxx)"
                      value={rp.name}
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
                  className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="ROM Branch (e.g., lineage-21.0)"
                  value={romBranch}
                  onChange={(e) => setRomBranch(e.target.value)}
                  className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                />
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

          {/* Right Column: Output */}
          <div className="lg:sticky lg:top-4">
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
              <pre className="bg-black text-green-400 p-3 rounded overflow-x-auto text-sm font-mono h-[calc(100vh-12rem)] overflow-y-auto border border-gray-600">
                {generateManifest()}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
