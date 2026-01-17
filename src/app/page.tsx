'use client'
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api'
import Image from "next/image";
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export default function Home() {
  const [recipe, setRecipe] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const projects = useQuery(api.projects.get)
  const createProject = useMutation(api.projects.create)

  const fetchRecipe = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/demo/blocking', { method: 'POST' });
      const data = await res.json();
      setRecipe(data.text);
    } catch (error) {
      console.error('Error fetching recipe:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-8 font-sans dark:bg-black">
      <Button onClick={fetchRecipe} disabled={loading}>
        {loading ? 'Loading...' : 'Get Gemini Recipe'}
      </Button>

      {recipe && (
        <div className="max-w-2xl rounded-lg border p-4 dark:border-zinc-700">
          <pre className="whitespace-pre-wrap text-sm">{recipe}</pre>
        </div>
      )}

      <div className="mt-8">
        <Button onClick={() => createProject({ name: 'New project' })}>
          Create Project
        </Button>
      </div>

      {projects?.map((project) => (
        <div className='border rounded p-2 flex flex-col' key={project._id}>
          <div className='flex items-center'>
            <Image src="/logo.svg" alt="Logo" width={50} height={50} />
            <div className='ml-2'>
              <h1 className='text-xl font-bold'>{project.name}</h1>
              <p className='text-sm'>{project.ownerId}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
