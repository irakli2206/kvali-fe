'use client'

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress"; // If you have shadcn progress
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Hero from "@/components/views/hero/index";

export default function Home() {
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
    <>
      <Hero />
    </>
  );
}