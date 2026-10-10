import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        login: resolve(import.meta.dirname, 'pages/login.html'),
        register: resolve(import.meta.dirname, 'pages/register.html'),
        supplies: resolve(import.meta.dirname, 'pages/supplies.html'),
        supplyForm: resolve(import.meta.dirname, 'pages/supply-form.html'),
        projects: resolve(import.meta.dirname, 'pages/projects.html'),
        projectForm: resolve(import.meta.dirname, 'pages/project-form.html'),
        projectDetail: resolve(import.meta.dirname, 'pages/project-detail.html'),
        profile: resolve(import.meta.dirname, 'pages/profile.html'),
      },
    },
  },
});
