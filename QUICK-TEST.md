# 🧪 Guia de Testes Rápido — AppBJJ 2.0

## Acesso
🌐 **URL:** https://appbjj-kids.web.app

---

## ✅ Teste 1: Login
**Tempo:** 1 min

```
1. Abrir https://appbjj-kids.web.app
2. Click em "Entrar com Google"
3. Selecionar conta Google
4. Verificar redirecionamento para dashboard
```

**Esperado:**
- ✅ Tela de loading aparece
- ✅ Tela de login com botão Google
- ✅ Popup de Google abre
- ✅ Dashboard carrega com perfil padrão

---

## ✅ Teste 2: Profile Management
**Tempo:** 2 min

```
1. Na dashboard do aluno, click em "+ Novo"
2. Digite nome "João Silva"
3. Digite idade "10"
4. Click em "Criar Perfil"
5. Verificar novo perfil aparece na lista
6. Click em novo perfil para mudar
7. Verificar ícone de ativo
8. Click no X do novo perfil e confirmar delete
```

**Esperado:**
- ✅ Modal abre com inputs
- ✅ Mensagem de sucesso "Perfil criado!"
- ✅ Novo perfil aparece na lista
- ✅ Click muda de perfil
- ✅ Delete remove e volta para outro

---

## ✅ Teste 3: Check-in Request
**Tempo:** 2 min

```
1. No dashboard do aluno
2. Click em "✋ Solicitar Check-in"
3. Verificar mensagem "Solicitação enviada"
4. Abrir console (F12) → Firestore deve ter registro
```

**Esperado:**
- ✅ Botão fica desativado por 1s
- ✅ Mensagem sucesso aparece
- ✅ Solicitação é enviada ao professor

---

## ✅ Teste 4: Theme Toggle
**Tempo:** 1 min

```
1. Click no ícone ☀️/🌙 no header
2. Verificar mudança de tema
3. Recarregar página
4. Verificar tema persiste
```

**Esperado:**
- ✅ Tema muda de dark para light
- ✅ Cores atualizam (glassmorphism mantém)
- ✅ Preferência salva em localStorage

---

## ✅ Teste 5: Profile Menu
**Tempo:** 1 min

```
1. Click no avatar (👤) no header direito
2. Verificar menu aparece
3. Click "Sair"
4. Confirmar logout
5. Verificar volta para tela de login
```

**Esperado:**
- ✅ Menu dropdown aparece
- ✅ Nome e email mostram
- ✅ Logout funciona
- ✅ Volta para tela de login

---

## ✅ Teste 6: Offline Functionality
**Tempo:** 2 min

```
1. Abrir DevTools (F12)
2. Ir para Network tab
3. Check "Offline"
4. Tentar criar novo perfil (deve funcionar com cache)
5. Fechar DevTools
6. Reconectar internet
7. Verificar sincronização
```

**Esperado:**
- ✅ App continua funcionando offline
- ✅ Service Worker serve cache
- ✅ Ao reconectar, dados sincronizam

---

## ✅ Teste 7: Responsividade
**Tempo:** 1 min

```
1. Abrir DevTools (F12)
2. Click no device toggle (celular)
3. Testar tamanhos: 480px, 768px, 1200px
4. Verificar layout adapta
```

**Esperado:**
- ✅ Mobile (480px) — Stackado, readable
- ✅ Tablet (768px) — 2 colunas
- ✅ Desktop (1200px) — Layout completo

---

## ✅ Teste 8: Professor Dashboard
**Tempo:** 2 min

```
1. Fazer login como professor (role = 'teacher')
   - Nota: Precisa mudar role no Firestore manualmente (dev)
2. Verificar dashboard diferente
3. Ver solicitações pendentes
4. Click em "Aprovar"
5. Verificar solicitação desaparece
```

**Esperado:**
- ✅ Dashboard mostra "Solicitações Pendentes"
- ✅ Botões ✅/❌ funcionam
- ✅ Solicitação é processada
- ✅ Aluno vê counter incrementado

---

## ✅ Teste 9: Browser Compatibility
**Tempo:** 2 min

```
Testar em:
1. Chrome
2. Firefox
3. Safari (se disponível)
4. Edge
```

**Esperado:**
- ✅ Design idêntico em todos
- ✅ Sem erros no console
- ✅ Performance similar

---

## ✅ Teste 10: Performance
**Tempo:** 1 min

```
1. Abrir DevTools (F12)
2. Network tab
3. Recarregar página (Ctrl+R)
4. Verificar:
   - LCP (Loading Complete): < 2s
   - Total JS size: < 100KB
   - Total CSS size: < 50KB
```

**Esperado:**
- ✅ App carrega em < 2 segundos
- ✅ Animações suaves (60fps)
- ✅ Sem jank ou lag

---

## 🐛 Bug Report Template

Se encontrar um bug:

```
**Título:** [Breve descrição]

**Steps:**
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

**Esperado:** [O que deveria acontecer]

**Atual:** [O que realmente acontece]

**Ambiente:**
- Navegador: [Chrome/Firefox/Safari/Edge]
- Tamanho: [Mobile/Tablet/Desktop]
- Conectividade: [Online/Offline]

**Console Errors:** [Paste stack trace from F12]
```

---

## 📊 Checklist de Aprovação

- [ ] Login funciona
- [ ] Criar perfil funciona
- [ ] Mudar perfil funciona
- [ ] Deletar perfil funciona
- [ ] Check-in request funciona
- [ ] Theme toggle funciona
- [ ] Menu de perfil funciona
- [ ] Offline mode funciona
- [ ] Responsivo em mobile
- [ ] Responsivo em tablet
- [ ] Responsivo em desktop
- [ ] Professor dashboard visible
- [ ] Aproveição de check-in funciona
- [ ] Design moderno (glassmorphism visível)
- [ ] Sem erros no console
- [ ] Sem warnings de performance

---

## 🎯 Próximos Passos (Se Encontrar Issues)

1. Abra console (F12)
2. Procure por erros vermelhos
3. Tire screenshot do erro
4. Reporte com bug template acima
5. Incluir URL e browser usado

---

## 📞 Dúvidas?

Consulte:
- [REFACTORING-COMPLETE.md](REFACTORING-COMPLETE.md) — Documentação completa
- [README.md](README.md) — Guia geral
- [IMPLEMENTATION-GUIDE.md](IMPLEMENTATION-GUIDE.md) — Detalhes técnicos

---

**Status:** ✅ READY FOR QA  
**Última atualização:** Janeiro 2025  
**Versão:** 2.0
