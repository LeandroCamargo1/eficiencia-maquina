# AppBJJ Kids - Protótipo Completo

Aplicativo web para acompanhamento de progresso em Jiu-Jitsu infantil com suporte a múltiplas crianças, faixas, graus, estatísticas avançadas e gamificação.

## 🚀 Recursos Implementados

### ✅ Core Features

#### 1. **Múltiplas Crianças & Perfis**
- Gerenciar múltiplos perfis com nome e idade
- Alternância rápida entre crianças
- Deletar perfis (mínimo 1 obrigatório)
- Histórico independente por criança
- Persistência em localStorage

#### 2. **Sistema de Faixas & Graus**
- 5 faixas: Branca, Azul, Roxa, Marrom, Preta
- Cores distintas para cada faixa
- Progressão automática de graus (0-4 por faixa)
- Transição automática para próxima faixa
- Visual dinâmico da faixa atual

#### 3. **Check-in de Aulas**
- Calendário mensal interativo
- Visualizar mês anterior/posterior
- Marcar presença em qualquer data
- Destaque para dia atual
- Visual de check-ins realizados

#### 4. **Progresso & Metas**
- Barra de progresso visual para próximo grau
- Aulas customizáveis para próximo grau (1-50)
- Meta de aulas por semana (1-7 dias)
- Contador de aulas totais
- Atualização em tempo real

#### 5. **Temas Dark/Light**
- Alternância de tema com botão no header
- Preferência salva em localStorage
- Cores adaptadas para cada tema
- Transições suaves

#### 6. **Estatísticas Avançadas**
- Streak de dias consecutivos
- Aulas nesta semana
- Total de aulas
- Taxa de assiduidade (%)
- Gráfico de frequência (últimos 30 dias)
- Chart.js integrado

#### 7. **Badges & Conquistas**
- 6 badges desbloqueáveis
- Primeiro check-in
- Streaks (7 e 30 dias)
- Faixas azul e marrom
- 100 aulas
- Visual earned/locked

#### 8. **Histórico de Atividades**
- Registro de todos os eventos
- Timestamps formatados (pt-BR)
- Tipo de evento (check-in, reset)
- Até 50 registros salvos
- Limpeza opcional

#### 9. **Desfazer (Undo)**
- Botão para desfazer última ação
- Reverte para snapshot anterior
- Desabilitado quando sem histórico
- Mantém histórico do undo

#### 10. **Reset Semanal**
- Limpar check-ins de 7 dias
- Validação para evitar reset desnecessário
- Mantém progresso de graus
- Registra no histórico

#### 11. **Modo Offline (PWA)**
- Service Worker configurado
- Cache de recursos críticos
- Instalável como app nativo
- Manifest.json completo
- Funciona sem internet

#### 12. **Configurações**
- Modal de configuração
- Ajustar aulas para próximo grau
- Definir meta semanal
- Preferências salvas

---

## 📱 Interface Responsiva

- **Mobile-first**: otimizado para celulares
- **Tablets**: layout adaptado com 2-3 colunas
- **Desktop**: grid completo com 4+ colunas
- **Breakpoints**: 768px, 1024px
- **Accessibility**: ARIA labels, focus states, semântica

---

## 🛠️ Stack Técnico

- **HTML5**: Semântico e acessível
- **CSS3**: Grid, Flexbox, variáveis CSS, transições
- **JavaScript Vanilla**: Sem dependências (exceto Chart.js)
- **Chart.js 3.9**: Gráficos interativos
- **Service Worker**: Suporte offline
- **PWA**: Manifest.json + SW

---

## 📦 Estrutura de Arquivos

```
AppBJJ/
├── index.html          # HTML principal
├── styles.css          # Estilos completos
├── app.js              # Lógica principal (v2)
├── script.js           # Scripts legados (compatibilidade)
├── sw.js               # Service Worker
├── manifest.json       # PWA manifest
├── README.md           # Esta documentação
└── styles-enhanced.css # Estilos adicionais (backup)
```

---

## 🎯 Como Usar

### Instalação

1. Abra `index.html` em um navegador moderno (Chrome, Firefox, Edge, Safari)
2. Ou hospede em um servidor local/web

### Primeiro Uso

1. Crie um novo perfil com nome e idade
2. Comece a marcar aulas no calendário
3. Veja o progresso em tempo real

### Recursos Principais

- **Menu de Perfis** (👤): Trocar de criança
- **Tema** (☀️/🌙): Alternar dark/light
- **Calendário**: Clique em qualquer dia para check-in
- **Check-in de Hoje**: Botão rápido
- **Configurações** (⚙️): Ajustar metas
- **Histórico**: Ver todas as ações

---

## 💾 Dados & Persistência

Todos os dados são salvos localmente em **localStorage** com chave `appbjj-kids-state-v2`:

```json
{
  "currentProfileId": "profile_...",
  "profiles": {
    "profile_...": {
      "id": "profile_...",
      "name": "João",
      "age": 8,
      "beltIndex": 0,
      "gradeInBelt": 0,
      "classesProgress": 0,
      "totalClasses": 0,
      "history": [...],
      "badges": [...],
      "checkedDates": {...},
      "createdAt": "2025-10-27..."
    }
  },
  "settings": {
    "classesForNextGrade": 10,
    "weeklyGoal": 3,
    "theme": "dark",
    "notificationsEnabled": true
  }
}
```

---

## 🎨 Paleta de Cores

| Nome | Hex | Uso |
|------|-----|-----|
| Preto | #0d0d0f | Fundo principal |
| Cinza Escuro | #17171b | Painéis |
| Cinza | #3b3b42 | Bordas, elementos secundários |
| Cinza Claro | #8b8b95 | Texto secundário |
| Branco | #f5f5f5 | Texto principal |
| Vermelho | #e53935 | Destaques, ações, progresso |

---

## 🔧 Configurações Ajustáveis

Em `app.js`:

```javascript
const MAX_GRADES_PER_BELT = 4;              // Graus por faixa
const BELTS = [/* 5 faixas */];             // Array de faixas
const HISTORY_LIMIT = 50;                   // Max histórico
const STORAGE_KEY = 'appbjj-kids-state-v2'; // LocalStorage key
```

---

## 📊 Exemplos de Uso

### Criar Novo Perfil
```
Clique em 👤 → + Novo Perfil → Digite nome e idade → Criar
```

### Dar Check-in
```
Opção 1: Clique no dia no calendário
Opção 2: Clique em "Dar check-in na aula de hoje"
```

### Alterar Configurações
```
Clique em ⚙️ → Ajuste aulas/meta → Salvar
```

### Visualizar Progresso
```
Veja em:
- Barra de progresso (visual)
- Gráfico de frequência (últimos 30 dias)
- Estatísticas (streak, assiduidade)
- Badges (conquistas)
```

---

## 🐛 Troubleshooting

### Dados não salvam
- Verifique se localStorage está habilitado
- Tente em modo privado/incógnito

### Gráfico não aparece
- Certifique-se de ter internet para Chart.js
- Recarregue a página (F5)

### PWA não funciona offline
- Certifique-se de ter visitado online primeiro (instala SW)
- Verifique console para erros do Service Worker

---

## 🚀 Roadmap (Próximas Melhorias)

### Curto Prazo
- [ ] Notificações Push (lembretes)
- [ ] Exportar PDF com relatório
- [ ] Compartilhar progresso (link)
- [ ] Notas do instrutor
- [ ] Sistema de pontos/recompensas

### Médio Prazo
- [ ] Backend Firebase (sincronizar múltiplos dispositivos)
- [ ] Login com email/senha
- [ ] Dashboard do instrutor
- [ ] Integração Google Calendar
- [ ] Análise preditiva

### Longo Prazo
- [ ] App mobile nativa (React Native)
- [ ] Leaderboard global (anônimo)
- [ ] Integração com academias
- [ ] Wearables (Apple Watch, Fitbit)
- [ ] Assinatura premium

---

## 📝 Notas de Desenvolvimento

- Código bem documentado com comentários
- Padrão modular com funções separadas
- Sem dependências externas (exceto Chart.js)
- Compatível com navegadores modernos (ES6+)
- Acessibilidade WCAG AA
- Performance otimizada

---

## 📄 Licença

Este é um protótipo educational. Uso livre para fins pessoais e comerciais.

---

## 👨‍💻 Desenvolvido por

GitHub Copilot - Versão completa com todas as melhorias implementadas.

**Data**: 27 de outubro de 2025

---

## 📞 Suporte

Para relatórios de bugs ou sugestões, abra uma issue no repositório.

---

## 🙏 Agradecimentos

- Comunidade Jiu-Jitsu infantil
- Contribuidores e testadores
- Fontes: Google Fonts (Montserrat), Chart.js, html2pdf

---

**Versão**: 1.0.0 - Full Featured  
**Status**: Beta (pronto para testes)  
**Última atualização**: 27 de outubro de 2025
