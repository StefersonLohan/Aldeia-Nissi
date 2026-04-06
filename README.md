# Aldeia Nissi - Sistema de Gestão Social 🇦🇴

![Banner](https://raw.githubusercontent.com/Jeova_Nissi/aldeia/main/app/src/assets/banner_readme.png)

## 📋 Sobre o Projeto

O **Aldeia Nissi** é uma plataforma moderna e completa desenvolvida para a gestão das operações sociais da Base Missionária Aldeia Nissi, localizada em Angola. O sistema foi projetado para operar em ambientes com conectividade instável, utilizando uma arquitetura **offline-first**, garantindo que os colaboradores possam realizar registros em campo e sincronizá-los automaticamente quando houver internet.

O foco do sistema é a gestão humanizada de alunos, viúvas e colaboradores, além do controle de acesso e frequência através de tecnologias de QR Code.

---

## ✨ Funcionalidades Principais

-   **👨‍🎓 Gestão de Alunos**: Cadastro completo com fotos, dados pessoais e busca inteligente.
-   **📑 Chamada via QR Code**: Sistema dinâmico para controle de presença e identificação rápida.
-   **📍 Visitas de Campo (Social)**: Mapeamento GPS integrado com Leaflet para registro de visitas a assistidos e famílias.
-   **📅 Controle de Ponto**: Registro de jornada de trabalho para colaboradores locais e voluntários.
-   **🔐 Gestão de Acessos**: Controle de usuários com diferentes níveis de permissão (Admin e Colaborador).
-   **🏢 Portaria**: Interface otimizada para check-in/check-out rápido e monitoramento de fluxo.
-   **🌐 Sincronização Inteligente**: Cache local robusto via Firestore para operação 100% offline.

---

## 🛠️ Tecnologias Utilizadas

Este projeto utiliza uma stack de ponta para garantir performance e escalabilidade:

-   **[Ionic Framework](https://ionicframework.com/)**: Desenvolvimento de interfaces híbridas e nativas.
-   **[Angular 20+](https://angular.io/)**: Base sólida para a lógica da aplicação.
-   **[PrimeNG](https://primeng.org/)**: Suite de componentes premium com design moderno e acessível.
-   **[Firebase](https://firebase.google.com/)**:
    -   **Firestore**: Banco de dados NoSQL com suporte nativo a persistência local.
    -   **Authentication**: Gestão segura de identidades.
    -   **Storage**: Armazenamento de fotos e documentos.
-   **[Capacitor](https://capacitorjs.com/)**: Integração profunda com hardware (Câmera, GPS, Escaneamento).
-   **[Leaflet](https://leafletjs.com/)**: Mapas interativos para logística de campo.

---

## 🎨 Design System

O projeto segue uma identidade visual **Orgânica, Humanizada e Calorosa**, baseada nas cores da terra e da natureza:

-   **Terracotta/Laranja Quente**: Energia, terra e ação.
-   **Amarelo Terra**: Calor humano e alegria.
-   **Verde Natureza**: Esperança e crescimento.

Toda a UI foi construída com foco em **experiência do usuário (UX)**, priorizando acessibilidade e facilidade de uso em dispositivos móveis.

---

## 🚀 Como Iniciar o Projeto

### Pré-requisitos
- Node.js (v18+)
- Ionic CLI (`npm install -g @ionic/cli`)

### Instalação
1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/aldeia.git
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente do Firebase em `src/environments/environment.ts`.

4. Execute o servidor de desenvolvimento:
```bash
npm run start
```

---

## 📱 Sincronização Offline

A aplicação foi construída sobre o motor de persistência do Google Cloud Firestore.
- Os dados são salvos em um banco de dados local (IndexedDB no browser ou SQLite em mobile).
- Quando o dispositivo detecta conexão com a rede, o Firebase sincroniza as mudanças em background de forma transparente para o usuário.

---

## 📄 Licença

Este projeto é de uso exclusivo da **Base Aldeia Nissi**. Todos os direitos reservados.

---

> "Transformando vidas através da educação e do cuidado social em Angola." 🧡
