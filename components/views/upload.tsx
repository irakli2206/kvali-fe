'use client'

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress"; // If you have shadcn progress
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Upload() {
    const [loading, setLoading] = useState(false);
    const [g25results, setG25Results] = useState<string | null>(null);
    const [k36results, setK36Results] = useState<Record<string, number> | null>(null);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://127.0.0.1:8000/raw-to-k36', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            console.log('K36 data', data)

            if (data.status === "success") {
                setK36Results(data.results);

                // 2. Pass those results to the G25 service
                const g25response = await fetch('http://127.0.0.1:8001/k36-to-g25', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // MUST have this
                    },
                    body: JSON.stringify(data.results), // MUST stringify the object
                });

                const g25data = await g25response.json();

                if (g25data.status === "success") {
                    // Note: make sure you use 'g25_string' or 'g25_array' 
                    // based on what your Python return statement says!
                    setG25Results(g25data.g25_string);
                }
            }


        } catch (error) {
            console.error("Kvali Engine connection error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-10 max-w-2xl mx-auto space-y-8">
            <div className="space-y-2">
                <h1 className="text-4xl font-medium tracking-tighter">Kvali</h1>
                <p className="text-neutral-500">Uncover the traces of your ancient lineage.</p>
            </div>

            <Input type="file" onChange={handleUpload} disabled={loading} className="cursor-pointer" />

            {loading && <div className="text-center py-10 animate-pulse text-gold-500">Decoding markers...</div>}

            {k36results && (
                <Card className="border-gold-500/20 bg-neutral-900/50">
                    <CardHeader>
                        <CardTitle className="text-xl">Historical Composition</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {Object.entries(k36results).map(([population, percentage]) => (
                            <div key={population} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{population}</span>
                                    <span className="text-neutral-400">{percentage}%</span>
                                </div>
                                {/* Visual bar */}
                                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-1000"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
            {g25results && (
                <p>{g25results}</p>
            )}

        </div>
    );
}