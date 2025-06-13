// auth.js - Lógica de Autenticação Simplificada (Local Storage) para TRACKER TICKET

document.addEventListener('DOMContentLoaded', () => {
    // Este código é executado assim que o DOM estiver completamente carregado.

    console.log('TRACKER TICKET - Script de autenticação carregado.');

    // --- Lógica de Autenticação Simplificada com LocalStorage ---
    // ATENÇÃO: Esta é uma simulação BÁSICA para um projeto local.
    // NÃO USE ESTA LÓGICA EM AMBIENTES DE PRODUÇÃO, pois não é segura.

    // Função para verificar o status de login e redirecionar se necessário
    function checkLoginStatus() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const currentPage = window.location.pathname.split('/').pop(); // Pega o nome do arquivo atual

        // Lista de páginas que NÃO requerem login
        const publicPages = ['login.html', 'register.html', '']; // '' representa a raiz, que pode ser login.html

        if (isLoggedIn) {
            // Se logado, impede acesso às páginas públicas (autenticação)
            if (publicPages.includes(currentPage)) {
                console.log('Usuário logado tentando acessar página pública, redirecionando para index.html');
                window.location.href = 'index.html';
            }
            // Se já estiver em index.html ou outra página protegida, não faz nada.
        } else {
            // Se NÃO logado, redireciona para a página de login se estiver em uma página protegida
            // Páginas protegidas são qualquer uma que NÃO esteja na lista publicPages
            if (!publicPages.includes(currentPage)) {
                 console.log('Usuário não logado tentando acessar página protegida, redirecionando para login.html');
                 window.location.href = 'login.html';
            }
            // Se já estiver em login.html ou register.html, não faz nada.
        }
    }

    // Adiciona a verificação de status de login no início da execução do script
    // Isso garante que o redirecionamento ocorra antes que a interface seja carregada
    checkLoginStatus();


    // --- Referências a Elementos do DOM de Autenticação ---
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginMessage = document.getElementById('loginMessage');
    const registerMessage = document.getElementById('registerMessage');


    // Lógica para a página de Login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value.trim();

            // Simula um usuário válido (substitua por lógica real em produção)
            // Apenas 'admin'/'password123' funciona nesta simulação
            if (username === 'admin' && password === 'password123') {
                localStorage.setItem('isLoggedIn', 'true'); // Marca como logado no localStorage
                if (loginMessage) {
                    loginMessage.textContent = 'Login bem-sucedido!';
                    loginMessage.classList.remove('error');
                    loginMessage.classList.add('success');
                     loginMessage.style.display = 'block';
                }
                console.log('Login bem-sucedido para:', username);
                // Redireciona para a página principal após um pequeno delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 800); // Delay ajustado
            } else {
                 if (loginMessage) {
                    loginMessage.textContent = 'Usuário ou senha inválidos.';
                    loginMessage.classList.remove('success');
                    loginMessage.classList.add('error');
                    loginMessage.style.display = 'block';
                 }
                console.warn('Falha no login para:', username);
            }
        });
    }

    // Lógica para a página de Cadastro
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = document.getElementById('registerUsername').value.trim();
            const password = document.getElementById('registerPassword').value.trim();
            const confirmPassword = document.getElementById('confirmPassword').value.trim();

            if (password !== confirmPassword) {
                 if (registerMessage) {
                    registerMessage.textContent = 'As senhas não coincidem.';
                    registerMessage.classList.remove('success');
                    registerMessage.classList.add('error');
                    registerMessage.style.display = 'block';
                 }
                 console.warn('Falha no cadastro: Senhas não coincidem.');
                return;
            }

             if (username.length < 3) {
                 if (registerMessage) {
                     registerMessage.textContent = 'Usuário deve ter pelo menos 3 caracteres.';
                     registerMessage.classList.remove('success');
                     registerMessage.classList.add('error');
                     registerMessage.style.display = 'block';
                 }
                 console.warn('Falha no cadastro: Usuário muito curto.');
                 return;
             }

             if (password.length < 6) {
                 if (registerMessage) {
                     registerMessage.textContent = 'Senha deve ter pelo menos 6 caracteres.';
                     registerMessage.classList.remove('success');
                     registerMessage.classList.add('error');
                     registerMessage.style.display = 'block';
                 }
                 console.warn('Falha no cadastro: Senha muito curta.');
                 return;
             }


            // Nesta simulação, o cadastro apenas mostra uma mensagem de sucesso e redireciona para login.
            // Ele NÃO salva o usuário. Use 'admin'/'password123' para testar o login.
             if (registerMessage) {
                registerMessage.textContent = 'Cadastro simulado com sucesso! Faça login com "admin".'; // Mensagem clara sobre a simulação
                registerMessage.classList.remove('error');
                registerMessage.classList.add('success');
                registerMessage.style.display = 'block';
             }
            console.log('Simulação de cadastro bem-sucedida para:', username);

            // Redireciona para a página de login após um pequeno delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000); // Delay de 2 segundos

            // Em um sistema real, você faria uma requisição para salvar o novo usuário aqui.
        });
    }

    // Função de logout básica (chamada do botão "Sair" em index.html)
    window.logout = function() {
        localStorage.removeItem('isLoggedIn'); // Remove a flag de login
        // Opcional: localStorage.removeItem('trackerTickets'); // Limpar dados do usuário ao sair
        console.log('Usuário deslogado.');
        window.location.href = 'login.html'; // Redireciona para a página de login
    };

});
