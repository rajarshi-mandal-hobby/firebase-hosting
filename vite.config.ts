import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';

export default defineConfig({
    build: {
        target: 'esnext',
        rolldownOptions: {
            output: {
                // Use the function pattern for Rolldown
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('@mantine')) return 'vendor-mantine';
                        if (id.includes('firebase')) return 'vendor-firebase';
                        if (id.includes('react')) return 'vendor-react';
                        return `vendor-${id.split('/').pop()}`;
                    }
                },
            },
        },
    },
    plugins: [
        react(),
        babel({
            presets: [reactCompilerPreset()]
        })
    ]
});
