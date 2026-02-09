'use client'

import React, { useState } from 'react';
import { Beaker, Database, User, Activity, Trash2, Play, Copy, Check } from 'lucide-react';
import { calculateDistances } from '@/lib/g25-utils';

const TABS = [
    { id: 'source', label: 'Source', icon: Database },
    { id: 'target', label: 'Target', icon: User },
    { id: 'distance', label: 'Distance', icon: Activity },
];

interface G25Result {
    target: string;
    matches: {
        label: string;
        distance: string;
    }[];
}

const VahaduoReact = () => {
    const [activeTab, setActiveTab] = useState('target');
    const [sourceData, setSourceData] = useState('');
    const [targetData, setTargetData] = useState('');
    const [results, setResults] = useState<G25Result[] | null>(null);
    const [copied, setCopied] = useState(false);

    const handleRunModel = () => {
        if (!sourceData.trim() || !targetData.trim()) return;

        // TypeScript now knows 'output' matches the 'results' state type
        const output = calculateDistances(sourceData, targetData);
        setResults(output);
        setActiveTab('distance');
    };

    const handleClear = () => {
        if (confirm("Clear all data and results?")) {
            setSourceData('');
            setTargetData('');
            setResults(null);
            setActiveTab('target');
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen w-full bg-zinc-950 text-zinc-100 p-6 font-sans selection:bg-blue-500/30">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <header className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-500/10 p-2 rounded-lg">
                            <Beaker className="text-blue-500" size={20} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight leading-none">VAHADUO</h1>
                            <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">Reactive Engine v1.0</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleClear}
                            className="p-2.5 hover:bg-zinc-900 rounded-md text-zinc-500 hover:text-red-400 transition-all active:scale-95"
                            title="Clear all"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button
                            onClick={handleRunModel}
                            disabled={!sourceData || !targetData}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 px-5 py-2 rounded-md font-semibold text-sm transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                        >
                            <Play size={14} fill="currentColor" /> RUN MODEL
                        </button>
                    </div>
                </header>

                {/* Tab Navigation */}
                <nav className="flex bg-zinc-900/50 p-1 rounded-xl w-fit border border-zinc-800 backdrop-blur-sm">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-zinc-800 text-blue-400 shadow-sm ring-1 ring-zinc-700'
                                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </nav>

                {/* Main Workspace */}
                <main className="min-h-[500px]">
                    {activeTab === 'source' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between items-end">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Source Populations (G25 CSV)</label>
                                <span className="text-[10px] text-zinc-600 font-mono">{sourceData.split('\n').filter(Boolean).length} samples loaded</span>
                            </div>
                            <textarea
                                value={sourceData}
                                onChange={(e) => setSourceData(e.target.value)}
                                className="w-full h-[450px] bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 font-mono text-sm focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-zinc-700 resize-none"
                                placeholder="Yamnaya_Samara,0.12,0.11,-0.02..."
                            />
                        </div>
                    )}

                    {activeTab === 'target' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between items-end">
                                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Target Samples (Your Coordinates)</label>
                                <span className="text-[10px] text-zinc-600 font-mono">{targetData.split('\n').filter(Boolean).length} samples loaded</span>
                            </div>
                            <textarea
                                value={targetData}
                                onChange={(e) => setTargetData(e.target.value)}
                                className="w-full h-[450px] bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 font-mono text-sm focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-zinc-700 resize-none"
                                placeholder="User_Sample,0.11,0.13,-0.01..."
                            />
                        </div>
                    )}

                    {activeTab === 'distance' && (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            {results ? results.map((res, i) => (
                                <div key={i} className="group bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl transition-all hover:border-zinc-700">
                                    <div className="bg-zinc-800/30 px-5 py-3 border-b border-zinc-800 flex justify-between items-center">
                                        <h3 className="font-bold text-sm tracking-tight text-blue-400 font-mono">{res.target}</h3>
                                        <button
                                            onClick={() => copyToClipboard(JSON.stringify(res.matches, null, 2))}
                                            className="text-zinc-500 hover:text-zinc-300 transition-colors"
                                        >
                                            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-[13px]">
                                            <thead>
                                                <tr className="text-zinc-500 border-b border-zinc-800/50 bg-zinc-950/20">
                                                    <th className="px-5 py-2.5 font-semibold uppercase tracking-widest text-[10px]">Reference Population</th>
                                                    <th className="px-5 py-2.5 font-semibold uppercase tracking-widest text-[10px] text-right">Euclidean Distance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-800/30">
                                                {res.matches.map((m, j) => (
                                                    <tr key={j} className="hover:bg-blue-500/5 transition-colors group/row">
                                                        <td className="px-5 py-2 font-mono text-zinc-300 group-hover/row:text-blue-200">{m.label}</td>
                                                        <td className="px-5 py-2 font-mono text-right text-zinc-500 tabular-nums">
                                                            {m.distance}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )) : (
                                <div className="h-[400px] flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-900 rounded-2xl bg-zinc-900/20">
                                    <Activity size={48} className="mb-4 opacity-20" />
                                    <p className="text-sm font-medium">Ready to calculate genetic distances.</p>
                                    <p className="text-xs text-zinc-700 mt-1">Provide Source and Target data to begin.</p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default VahaduoReact;