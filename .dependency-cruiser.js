/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-isolation-violation',
      comment: 'O Domínio deve ser cego (Arquitetura Hexagonal). É proibido importar a camada de Adaptação ou dependências externas dentro do Domínio.',
      severity: 'error',
      from: {
        path: '^typescript/domain'
      },
      to: {
        path: [
          '^typescript/adapters',
          '^node_modules'
        ]
      }
    }
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'require', 'node', 'default'] }
  }
};