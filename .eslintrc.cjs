module.exports = {
    // Or 'jejolare/backend' for Node.js app
    extends: ['jejolare/backend'],

    rules: {
        'no-use-before-define': 'off',
        '@typescript-eslint/no-use-before-define': 'error',
    },

    // This is needed only if you use TypeScript
    settings: {
        'import/resolver': {
            typescript: {
                project: './tsconfig.json',
            },
        },
    },
};
