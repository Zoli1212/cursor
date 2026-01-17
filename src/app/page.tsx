'use client'
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api'
import Image from "next/image";

import { Button } from '@/components/ui/button';
import { create } from 'domain';

export default function Home() {


  const projects = useQuery(api.projects.get)
  const createProject = useMutation(api.projects.create)

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Button onClick={() => createProject({
        name: 'New project'

      })}>Create Project</Button>
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
