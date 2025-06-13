// script.js - Lógica do Dashboard TRACKER TICKET

document.addEventListener('DOMContentLoaded', () => {
    console.log('TRACKER TICKET - Script principal carregado.');

    // --- Verificação de Autenticação ---
    // (Chamada aqui para garantir que a lógica de autenticação em auth.js rode primeiro)
    // A função checkLoginStatus está definida em auth.js e é chamada no início daquele script.
    // Não precisamos chamá-la novamente aqui, apenas garantir que auth.js seja carregado antes.


    // --- Referências a Elementos do DOM ---
    const dashboard = document.getElementById('dashboard');
    const navItems = document.querySelectorAll('.nav-item');
    const contentTabs = document.querySelectorAll('.content-tab');
    const mainContentTitle = document.getElementById('mainContentTitle');
    const addTicketBtnMainHeader = document.getElementById('addTicketBtnMainHeader');
    const fabAddTicketBtn = document.getElementById('fabAddTicketBtn'); // Floating Action Button
    const logoutBtn = document.getElementById('logoutBtn');

    // Stats Cards
    const pendingCount = document.getElementById('pendingCount');
    const lateCount = document.getElementById('lateCount');
    const resolvedCount = document.getElementById('resolvedCount');

    // Tickets Containers
    const activeTicketsContainer = document.getElementById('activeTicketsContainer');
    const resolvedTicketsContainer = document.getElementById('resolvedTicketsContainer');

    // Filtros
    const searchBar = document.getElementById('searchBar');
    const statusFilter = document.getElementById('statusFilter');
    const responsibleFilter = document.getElementById('responsibleFilter');
    const searchBarResolved = document.getElementById('searchBarResolved');
    const responsibleFilterResolved = document.getElementById('responsibleFilterResolved');


    // Modal
    const ticketModal = document.getElementById('ticketModal');
    const modalTitle = document.getElementById('modalTitle');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const ticketForm = document.getElementById('ticketForm');

    // Modal Form Fields
    const ticketIdInput = document.getElementById('ticketId'); // Campo escondido para ID
    const ticketNumberInput = document.getElementById('ticketNumber');
    const clientNameInput = document.getElementById('clientName');
    const ticketTitleInput = document.getElementById('ticketTitle');
    const ticketDescriptionInput = document.getElementById('ticketDescription');
    const responsibleInput = document.getElementById('responsible');
    const openDateInput = document.getElementById('openDate');
    const lastMovementDateInput = document.getElementById('lastMovementDate');
    const nextActionDateInput = document.getElementById('nextActionDate');
    const ticketStatusInput = document.getElementById('ticketStatus');
    const observationsInput = document.getElementById('observations');

    // Modal History Section
    const historySection = document.getElementById('historySection');
    const ticketHistoryList = document.getElementById('ticketHistoryList');
    const newHistoryEntryInput = document.getElementById('newHistoryEntry');
    const addHistoryBtn = document.getElementById('addHistoryBtn');
    const noHistoryMessage = historySection ? historySection.querySelector('.no-history-message') : null;


    // Charts (Analytics Tab)
    const statusChartCanvas = document.getElementById('statusChart');
    const responsibleChartCanvas = document.getElementById('responsibleChart');
    let statusChartInstance = null; // Para armazenar a instância do gráfico de Status
    let responsibleChartInstance = null; // Para armazenar a instância do gráfico de Responsáveis


    // --- Variáveis de Estado ---
    let tickets = []; // Array para armazenar os tickets
    let currentActiveSection = 'dashboard'; // Controla a seção ativa (dashboard, tickets, resolved, analytics)


    // --- Funções Utilitárias ---

    // Gera um ID único simples (para simulação)
    function generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    // Formata a data para o formato YYYY-MM-DD (necessário para input type="date")
    function formatDateInput(date) {
        if (!date) return '';
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }

    // Verifica se um ticket está atrasado
    function isTicketLate(ticket) {
         if (ticket.status === 'resolved') return false; // Tickets resolvidos não podem estar atrasados
         if (!ticket.nextActionDate) return false; // Tickets sem próxima ação não estão atrasados

         const today = new Date();
         today.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data

         const nextAction = new Date(ticket.nextActionDate);
         nextAction.setHours(0, 0, 0, 0);

         // Um ticket está atrasado se a data da próxima ação for anterior a hoje
         return nextAction < today;
    }


    // --- Funções de LocalStorage ---

    // Carrega tickets do LocalStorage
    function loadTickets() {
        const storedTickets = localStorage.getItem('trackerTickets');
        if (storedTickets) {
            tickets = JSON.parse(storedTickets);
            console.log('Tickets carregados do LocalStorage:', tickets.length);
        } else {
            tickets = []; // Inicializa vazio se não houver nada no LocalStorage
            console.log('Nenhum ticket encontrado no LocalStorage.');
        }
    }

    // Salva tickets no LocalStorage
    function saveTickets() {
        localStorage.setItem('trackerTickets', JSON.stringify(tickets));
        console.log('Tickets salvos no LocalStorage.');
    }


    // --- Funções de Renderização e Atualização ---

    // Atualiza os contadores no dashboard
    function updateDashboard() {
        // Recarrega os tickets para garantir que a contagem de atrasados esteja correta
        loadTickets();

        let pending = 0;
        let late = 0;
        let resolved = 0;

        tickets.forEach(ticket => {
            if (ticket.status === 'resolved') {
                resolved++;
            } else if (isTicketLate(ticket)) {
                late++;
            } else {
                pending++;
            }
        });

        if (pendingCount) pendingCount.textContent = pending;
        if (lateCount) lateCount.textContent = late;
        if (resolvedCount) resolvedCount.textContent = resolved;

        console.log(`Dashboard atualizado: Pendentes=${pending}, Atrasados=${late}, Finalizados=${resolved}`);

        // Atualiza os gráficos sempre que o dashboard é atualizado
        if (currentActiveSection === 'analytics') {
             updateCharts();
        }
         // Atualiza os filtros de responsável
         populateResponsibleFilters();
         // Re-renderiza os tickets ativos/finalizados para refletir possíveis mudanças de status (ex: atrasado)
         if (currentActiveSection === 'tickets' || currentActiveSection === 'resolved') {
             renderTickets();
         }

    }

    // Renderiza a lista de tickets (ativos ou finalizados)
    function renderTickets() {
        console.log(`Renderizando tickets para a seção: ${currentActiveSection}`);

        const container = currentActiveSection === 'tickets' ? activeTicketsContainer : resolvedTicketsContainer;
        const isResolvedSection = currentActiveSection === 'resolved';

        if (!container) {
            console.error(`Container para a seção "${currentActiveSection}" não encontrado.`);
            return; // Sai da função se o container não existir
        }

        // Limpa o container antes de renderizar
        container.innerHTML = '';

        // Pega os valores dos filtros relevantes para a seção atual
        const searchTerm = (isResolvedSection ? searchBarResolved : searchBar)?.value.toLowerCase() || '';
        const statusFilterValue = isResolvedSection ? '' : statusFilter?.value || ''; // Status filter only for active
        const responsibleFilterValue = (isResolvedSection ? responsibleFilterResolved : responsibleFilter)?.value || '';


        // Filtra os tickets com base na seção e nos filtros
        const filteredTickets = tickets.filter(ticket => {
            const matchesSection = isResolvedSection ? ticket.status === 'resolved' : ticket.status !== 'resolved';
            if (!matchesSection) return false;

            const ticketStatus = isTicketLate(ticket) ? 'late' : ticket.status; // Considera atrasados para filtro de status

            const matchesSearch = ticket.ticketNumber.toLowerCase().includes(searchTerm) ||
                                  ticket.clientName.toLowerCase().includes(searchTerm) ||
                                  ticket.ticketTitle.toLowerCase().includes(searchTerm) ||
                                  ticket.responsible.toLowerCase().includes(searchTerm) ||
                                  ticket.observations.toLowerCase().includes(searchTerm); // Inclui observações na busca

            const matchesStatus = statusFilterValue === '' || ticketStatus === statusFilterValue;
            const matchesResponsible = responsibleFilterValue === '' || ticket.responsible === responsibleFilterValue;


            return matchesSearch && matchesStatus && matchesResponsible;
        });

         // Ordena os tickets (ex: ativos por data de próxima ação, finalizados por data de última movimentação)
        filteredTickets.sort((a, b) => {
            if (isResolvedSection) {
                // Ordenar finalizados pela data de última movimentação (mais recente primeiro)
                const dateA = new Date(a.lastMovementDate || a.openDate);
                const dateB = new Date(b.lastMovementDate || b.openDate);
                 return dateB - dateA;
            } else {
                 // Ordenar ativos: Atrasados primeiro, depois por próxima ação (mais antiga primeiro)
                 const aIsLate = isTicketLate(a);
                 const bIsLate = isTicketLate(b);

                 if (aIsLate && !bIsLate) return -1; // Atrasado vem antes
                 if (!aIsLate && bIsLate) return 1; // Não atrasado vem depois

                 // Se ambos são atrasados ou ambos não são, ordena pela próxima ação
                 const nextA = a.nextActionDate ? new Date(a.nextActionDate) : new Date('9999-12-31'); // Datas futuras para tickets sem próxima ação
                 const nextB = b.nextActionDate ? new Date(b.nextActionDate) : new Date('9999-12-31');

                 return nextA - nextB; // Mais antiga primeiro
            }
        });


        if (filteredTickets.length === 0) {
             const noTicketsMsg = container.querySelector('.no-tickets-message');
             if (noTicketsMsg) {
                 noTicketsMsg.style.display = 'block';
                 container.appendChild(noTicketsMsg); // Move a mensagem para dentro do container
             } else {
                 // Cria a mensagem se não existir
                 const msg = document.createElement('p');
                 msg.classList.add('no-tickets-message');
                 msg.textContent = isResolvedSection ? 'Nenhum ticket finalizado encontrado com os filtros aplicados.' : 'Nenhum ticket ativo encontrado com os filtros aplicados.';
                 container.appendChild(msg);
             }
        } else {
             const noTicketsMsg = container.querySelector('.no-tickets-message');
             if (noTicketsMsg) noTicketsMsg.style.display = 'none';

             filteredTickets.forEach(ticket => {
                 const ticketCardHTML = renderTicketCard(ticket);
                 container.innerHTML += ticketCardHTML; // Adiciona o HTML do card
             });
        }

        console.log(`Renderização completa. ${filteredTickets.length} tickets exibidos.`);
    }

    // Gera o HTML para um único ticket card
    function renderTicketCard(ticket) {
         const ticketStatus = isTicketLate(ticket) ? 'late' : ticket.status;
         const statusText = ticketStatus.charAt(0).toUpperCase() + ticketStatus.slice(1); // Capitaliza a primeira letra

         // Determina a visibilidade dos botões de ação
         const isResolved = ticket.status === 'resolved';
         const actionsHTML = isResolved ?
             `
             <button class="action-btn delete-btn" data-id="${ticket.id}" title="Excluir Ticket"><i class="fas fa-trash"></i></button>
             ` :
             `
             <button class="action-btn edit-btn" data-id="${ticket.id}" title="Editar Ticket"><i class="fas fa-edit"></i></button>
             <button class="action-btn resolve-btn" data-id="${ticket.id}" title="Marcar como Finalizado"><i class="fas fa-check"></i></button>
             <button class="action-btn delete-btn" data-id="${ticket.id}" title="Excluir Ticket"><i class="fas fa-trash"></i></button>
             `;


         return `
            <div class="ticket-card ${ticketStatus}" data-id="${ticket.id}">
                <div class="ticket-card-header">
                    <div class="ticket-card-title">
                        ${ticket.ticketNumber} - ${ticket.clientName}
                        <p style="font-size: 0.9em; color: var(--text-secondary); font-weight: 500; margin-top: 4px;">${ticket.ticketTitle}</p>
                    </div>
                    <div class="ticket-card-meta">
                         <span class="ticket-status ${ticketStatus}">${statusText}</span>
                         <div class="ticket-actions">
                             ${actionsHTML}
                         </div>
                    </div>
                </div>
                <div class="ticket-card-body">
                     <p><strong>Descrição:</strong> ${ticket.ticketDescription || 'N/A'}</p>
                     <p><strong>Responsável:</strong> ${ticket.responsible}</p>
                     ${ticket.observations ? `<p><strong>Observações:</strong> ${ticket.observations}</p>` : ''}
                </div>
                <div class="ticket-card-footer">
                    <span><i class="fas fa-calendar-alt"></i> Abertura: ${formatDateInput(ticket.openDate)}</span>
                    ${ticket.lastMovementDate ? `<span><i class="fas fa-history"></i> Última Mov.: ${formatDateInput(ticket.lastMovementDate)}</span>` : ''}
                    ${ticket.nextActionDate && !isResolved ? `<span><i class="fas fa-calendar-check"></i> Próx. Ação: ${formatDateInput(ticket.nextActionDate)}</span>` : ''}
                </div>
            </div>
         `;
    }

    // Popula os dropdowns de filtro de responsável com os responsáveis únicos dos tickets
    function populateResponsibleFilters() {
        const responsibleNames = [...new Set(tickets.map(ticket => ticket.responsible).filter(name => name))]; // Nomes únicos, remove vazios
        responsibleNames.sort(); // Ordena alfabeticamente

        // Salva o valor selecionado atual antes de limpar
        const currentActiveValue = responsibleFilter?.dataset.currentValue || '';
        const currentResolvedValue = responsibleFilterResolved?.dataset.currentValue || '';


        // Limpa os selects
        if (responsibleFilter) responsibleFilter.innerHTML = '<option value="">Todos os Responsáveis</option>';
        if (responsibleFilterResolved) responsibleFilterResolved.innerHTML = '<option value="">Todos os Responsáveis</option>';

        // Adiciona as novas opções
        responsibleNames.forEach(name => {
            const option = `<option value="${name}">${name}</option>`;
            if (responsibleFilter) responsibleFilter.innerHTML += option;
            if (responsibleFilterResolved) responsibleFilterResolved.innerHTML += option;
        });

        // Restaura o valor selecionado, se ele ainda existir nas novas opções
        if (responsibleFilter) {
             responsibleFilter.value = responsibleNames.includes(currentActiveValue) ? currentActiveValue : '';
             responsibleFilter.dataset.currentValue = responsibleFilter.value; // Atualiza o valor salvo
        }
         if (responsibleFilterResolved) {
             responsibleFilterResolved.value = responsibleNames.includes(currentResolvedValue) ? currentResolvedValue : '';
             responsibleFilterResolved.dataset.currentValue = responsibleFilterResolved.value; // Atualiza o valor salvo
        }


        console.log('Filtros de responsável populados.');
    }


    // Inicializa ou atualiza os gráficos com dados dos tickets
    function updateCharts() {
        console.log('Atualizando gráficos...');

        // Dados para o gráfico de Status
        const statusCounts = tickets.reduce((acc, ticket) => {
            const status = isTicketLate(ticket) ? 'late' : ticket.status; // Conta atrasados como um status
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        const statusLabels = ['pending', 'late', 'resolved'];
        const statusData = statusLabels.map(status => statusCounts[status] || 0);
        const statusColors = [
            'rgba(255, 149, 0, 0.8)', // Orange - Pending
            'rgba(220, 20, 60, 0.8)', // Red - Late
            'rgba(52, 199, 89, 0.8)'  // Green - Resolved
        ];
         const statusBorderColors = [
            'rgba(255, 149, 0, 1)',
            'rgba(220, 20, 60, 1)',
            'rgba(52, 199, 89, 1)'
        ];


        // Dados para o gráfico de Responsáveis
        const responsibleCounts = tickets.reduce((acc, ticket) => {
            const responsible = ticket.responsible || 'Não Atribuído';
            acc[responsible] = (acc[responsible] || 0) + 1;
            return acc;
        }, {});

        const responsibleLabels = Object.keys(responsibleCounts);
        const responsibleData = Object.values(responsibleCounts);
        // Gera cores dinâmicas que funcionem bem em light mode
        const responsibleColors = responsibleLabels.map((_, index) => `hsl(${index * 50 % 360}, 60%, 50%)`); // Cores com saturação e luminosidade ajustadas


        // Destrói instâncias de gráfico existentes antes de criar novas
        if (statusChartInstance) {
            statusChartInstance.destroy();
        }
        if (responsibleChartInstance) {
            responsibleChartInstance.destroy();
        }

        // Configuração e criação do gráfico de Status (Pizza)
        if (statusChartCanvas) {
             const ctxStatus = statusChartCanvas.getContext('2d');
             statusChartInstance = new Chart(ctxStatus, {
                 type: 'pie',
                 data: {
                     labels: statusLabels.map(label => {
                         if (label === 'pending') return 'Pendentes';
                         if (label === 'late') return 'Atrasados';
                         if (label === 'resolved') return 'Finalizados';
                         return label; // Fallback
                     }),
                     datasets: [{
                         data: statusData,
                         backgroundColor: statusColors,
                         borderColor: statusBorderColors,
                         borderWidth: 1
                     }]
                 },
                 options: {
                     responsive: true,
                     maintainAspectRatio: false,
                     plugins: {
                         legend: {
                             labels: {
                                 color: 'var(--text-secondary)' // Cor da legenda (usando variável CSS)
                             }
                         },
                         tooltip: {
                             callbacks: {
                                 label: function(tooltipItem) {
                                     return tooltipItem.label + ': ' + tooltipItem.raw + ' (' + ((tooltipItem.raw / statusData.reduce((a, b) => a + b, 0)) * 100).toFixed(1) + '%)';
                                 }
                             }
                         }
                     }
                 }
             });
             console.log('Gráfico de Status atualizado.');
        }


        // Configuração e criação do gráfico de Responsáveis (Barra)
         if (responsibleChartCanvas) {
             const ctxResponsible = responsibleChartCanvas.getContext('2d');
             responsibleChartInstance = new Chart(ctxResponsible, {
                 type: 'bar',
                 data: {
                     labels: responsibleLabels,
                     datasets: [{
                         label: 'Número de Tickets',
                         data: responsibleData,
                         backgroundColor: responsibleColors,
                         borderColor: responsibleColors.map(color => color.replace('0.8', '1')), // Borda mais sólida
                         borderWidth: 1
                     }]
                 },
                 options: {
                     responsive: true,
                     maintainAspectRatio: false,
                      scales: {
                         y: {
                             beginAtZero: true,
                             ticks: {
                                 color: 'var(--text-secondary)', // Cor dos ticks do eixo Y (usando variável CSS)
                                 precision: 0 // Apenas números inteiros
                             },
                             grid: {
                                 color: 'var(--border-subtle)' // Cor da grade do eixo Y (usando variável CSS)
                             }
                         },
                         x: {
                             ticks: {
                                 color: 'var(--text-secondary)' // Cor dos ticks do eixo X (usando variável CSS)
                             },
                             grid: {
                                 display: false // Oculta a grade do eixo X
                             }
                         }
                     },
                     plugins: {
                         legend: {
                             display: false // Oculta a legenda (já tem label no dataset)
                         }
                     }
                 }
             });
             console.log('Gráfico de Responsáveis atualizado.');
         }

    }


    // --- Funções do Modal ---

    // Abre o modal
    function openModal() {
        ticketModal.classList.add('active');
        // Adiciona um pequeno delay para a animação de entrada
        setTimeout(() => {
             ticketModal.style.display = 'flex';
        }, 10); // Delay mínimo
        document.body.style.overflow = 'hidden'; // Impede scroll do body
        console.log('Modal aberto.');
    }

    // Fecha o modal
    function closeModal() {
        ticketModal.classList.remove('active');
         // Adiciona um pequeno delay para a animação de saída
        setTimeout(() => {
             ticketModal.style.display = 'none';
        }, 300); // Tempo da animação CSS
        document.body.style.overflow = ''; // Restaura scroll do body
        ticketForm.reset(); // Limpa o formulário ao fechar
        historySection.style.display = 'none'; // Esconde histórico por padrão
        ticketIdInput.value = ''; // Limpa o ID escondido
        console.log('Modal fechado.');
    }

    // Preenche o formulário do modal com dados de um ticket existente para edição
    function fillModalForEdit(ticket) {
        modalTitle.textContent = 'Editar Ticket';
        ticketIdInput.value = ticket.id;
        ticketNumberInput.value = ticket.ticketNumber;
        clientNameInput.value = ticket.clientName;
        ticketTitleInput.value = ticket.ticketTitle;
        ticketDescriptionInput.value = ticket.ticketDescription;
        responsibleInput.value = ticket.responsible;
        openDateInput.value = formatDateInput(ticket.openDate);
        lastMovementDateInput.value = formatDateInput(ticket.lastMovementDate);
        nextActionDateInput.value = formatDateInput(ticket.nextActionDate);
        ticketStatusInput.value = ticket.status;
        observationsInput.value = ticket.observations;

        // Exibe e renderiza o histórico
        historySection.style.display = 'block';
        renderHistory(ticket.history);

        openModal();
        console.log('Modal preenchido para editar ticket:', ticket.id);
    }

    // --- Funções de CRUD (Create, Read, Update, Delete) ---

    // Adiciona ou atualiza um ticket
    function saveTicket(e) {
        e.preventDefault();

        // Validação básica
        if (!ticketNumberInput.value || !clientNameInput.value || !ticketTitleInput.value || !responsibleInput.value || !openDateInput.value || !ticketStatusInput.value) {
             alert('Por favor, preencha todos os campos obrigatórios.');
             return;
        }


        const id = ticketIdInput.value || generateId(); // Usa o ID existente ou gera um novo
        // Encontra o ticket existente para manter o histórico, se for edição
        const existingTicket = tickets.find(t => t.id === id);
        const history = existingTicket ? existingTicket.history : []; // Mantém o histórico existente ou começa vazio

        const newTicket = {
            id: id,
            ticketNumber: ticketNumberInput.value.trim(),
            clientName: clientNameInput.value.trim(),
            ticketTitle: ticketTitleInput.value.trim(),
            ticketDescription: ticketDescriptionInput.value.trim(),
            responsible: responsibleInput.value.trim(),
            openDate: openDateInput.value,
            lastMovementDate: lastMovementDateInput.value || formatDateInput(new Date()), // Data de última movimentação padrão (hoje se vazio)
            nextActionDate: nextActionDateInput.value,
            status: ticketStatusInput.value,
            observations: observationsInput.value.trim(),
            history: history // Adiciona o histórico (existente ou vazio) ao objeto ticket
        };

        const existingIndex = tickets.findIndex(t => t.id === newTicket.id);

        if (existingIndex > -1) {
            // Atualiza ticket existente
             // Mantém a data de última movimentação apenas se o status mudar para resolved
             if (tickets[existingIndex].status !== newTicket.status && newTicket.status === 'resolved') {
                 newTicket.lastMovementDate = formatDateInput(new Date());
             } else if (tickets[existingIndex].status === newTicket.status) {
                 // Se o status não mudou, mantém a data de última movimentação original ou a nova se preenchida
                 newTicket.lastMovementDate = lastMovementDateInput.value || tickets[existingIndex].lastMovementDate;
             } else {
                  // Se o status mudou para algo diferente de resolved, usa a data preenchida ou a de abertura
                  newTicket.lastMovementDate = lastMovementDateInput.value || newTicket.openDate;
             }


            tickets[existingIndex] = newTicket;
            console.log('Ticket atualizado:', newTicket.id);
        } else {
            // Adiciona novo ticket
             // Define a data de última movimentação para o dia de hoje se não foi preenchida
             if (!newTicket.lastMovementDate) {
                 newTicket.lastMovementDate = formatDateInput(new Date());
             }
            tickets.push(newTicket);
            console.log('Novo ticket adicionado:', newTicket.id);
        }

        saveTickets(); // Salva no LocalStorage
        updateDashboard(); // Atualiza o dashboard (que chama renderTickets e updateCharts)
        closeModal(); // Fecha o modal
    }

    // Edita um ticket existente
    function editTicket(id) {
        console.log('Tentando editar ticket com ID:', id);
        const ticketToEdit = tickets.find(t => t.id === id);
        if (ticketToEdit) {
            fillModalForEdit(ticketToEdit);
        } else {
            console.error('Ticket não encontrado para edição:', id);
        }
    }

    // Exclui um ticket
    function deleteTicket(id) {
        console.log('Tentando excluir ticket com ID:', id);
        if (confirm('Tem certeza que deseja excluir este ticket?')) {
            tickets = tickets.filter(t => t.id !== id);
            saveTickets(); // Salva no LocalStorage
            updateDashboard(); // Atualiza o dashboard (que chama renderTickets e updateCharts)
            console.log('Ticket excluído:', id);
        }
    }

    // Marca um ticket como finalizado
    function resolveTicket(id) {
         console.log('Tentando finalizar ticket com ID:', id);
         const ticketIndex = tickets.findIndex(t => t.id === id);
         if (ticketIndex > -1) {
             if (tickets[ticketIndex].status !== 'resolved') {
                 tickets[ticketIndex].status = 'resolved';
                 tickets[ticketIndex].lastMovementDate = formatDateInput(new Date()); // Define a data de finalização
                 // Adiciona uma entrada no histórico
                 const timestamp = new Date().toLocaleString('pt-BR');
                 const historyEntry = `${timestamp}: Ticket marcado como FINALIZADO.`;
                 if (!tickets[ticketIndex].history) tickets[ticketIndex].history = [];
                 tickets[ticketIndex].history.push(historyEntry);

                 saveTickets(); // Salva a alteração
                 updateDashboard(); // Atualiza o dashboard (que chama renderTickets e updateCharts)
                 console.log('Ticket finalizado:', id);
             } else {
                 console.log('Ticket já estava finalizado:', id);
             }
         } else {
             console.error('Ticket não encontrado para finalizar:', id);
         }
    }


    // Adiciona uma entrada ao histórico do ticket que está sendo editado no modal
    function addHistoryEntry() {
        const entryText = newHistoryEntryInput.value.trim();
        const ticketId = ticketIdInput.value;

        if (!entryText || !ticketId) {
            console.warn('Não é possível adicionar entrada de histórico: texto vazio ou ticket ID ausente.');
            return;
        }

        const ticketIndex = tickets.findIndex(t => t.id === ticketId);
        if (ticketIndex > -1) {
            const timestamp = new Date().toLocaleString('pt-BR'); // Data e hora atuais
            const newEntry = `${timestamp}: ${entryText}`;
            if (!tickets[ticketIndex].history) tickets[ticketIndex].history = []; // Garante que o array exista
            tickets[ticketIndex].history.push(newEntry);
            tickets[ticketIndex].lastMovementDate = formatDateInput(new Date()); // Atualiza a data de última movimentação

            saveTickets(); // Salva a alteração no histórico
            renderHistory(tickets[ticketIndex].history); // Re-renderiza a lista de histórico no modal
            newHistoryEntryInput.value = ''; // Limpa o input
            // Rola para o final da lista de histórico
            ticketHistoryList.scrollTop = ticketHistoryList.scrollHeight;

            // Se o modal estiver aberto e o ticket não estiver resolvido, atualiza o dashboard
            if (ticketModal.classList.contains('active') && tickets[ticketIndex].status !== 'resolved') {
                 updateDashboard(); // Atualiza dashboard para refletir a nova data de última movimentação
            }

            console.log('Entrada de histórico adicionada para ticket:', ticketId);
        } else {
            console.error('Ticket não encontrado para adicionar histórico:', ticketId);
        }
    }

     // Renderiza o histórico de movimentações no modal
    function renderHistory(history = []) {
        if (!ticketHistoryList || !noHistoryMessage) return; // Garante que os elementos existam

        ticketHistoryList.innerHTML = ''; // Limpa a lista atual
        if (history.length === 0) {
            noHistoryMessage.style.display = 'block';
        } else {
            noHistoryMessage.style.display = 'none';
            history.forEach(entry => {
                const historyEntryElement = document.createElement('div');
                historyEntryElement.classList.add('history-entry');
                historyEntryElement.textContent = entry;
                ticketHistoryList.appendChild(historyEntryElement);
            });
        }
         // Rola para o final da lista de histórico ao renderizar
         ticketHistoryList.scrollTop = ticketHistoryList.scrollHeight;
    }


    // --- Funções de Navegação ---

    // Exibe a seção de conteúdo correspondente ao item de navegação clicado
    function displayContentSection(sectionId) {
        console.log('Exibindo seção:', sectionId);
        currentActiveSection = sectionId; // Atualiza a seção ativa

        contentTabs.forEach(tab => {
            if (tab.id === sectionId + 'Tab') { // Assume que o ID da tab é o sectionId + 'Tab'
                tab.classList.add('active');
                // Força re-renderização ou atualização ao mudar de tab
                 if (sectionId === 'tickets' || sectionId === 'resolved') {
                     renderTickets();
                 } else if (sectionId === 'analytics') {
                     updateCharts();
                 }
            } else {
                tab.classList.remove('active');
            }
        });

        // Atualiza o título do cabeçalho principal
        const tabTitleMap = {
            dashboard: 'Dashboard',
            tickets: 'Tickets Ativos',
            resolved: 'Tickets Finalizados',
            analytics: 'Analytics'
        };
        mainContentTitle.textContent = tabTitleMap[sectionId] || 'Tracker Ticket'; // Título padrão


         // Controla a visibilidade do botão "Novo Ticket" no cabeçalho principal e FAB
         if (sectionId === 'tickets' || sectionId === 'dashboard') {
              // Em telas pequenas, o FAB aparece, o botão do header esconde (controlado pelo CSS)
             if (addTicketBtnMainHeader) addTicketBtnMainHeader.style.display = 'flex';
             if (fabAddTicketBtn) fabAddTicketBtn.style.display = 'flex';
         } else {
             if (addTicketBtnMainHeader) addTicketBtnMainHeader.style.display = 'none';
             if (fabAddTicketBtn) fabAddTicketBtn.style.display = 'none';
         }
    }

    // Atualiza a classe 'active' nos itens de navegação lateral
    function updateActiveNavItem() {
        navItems.forEach(item => {
            const tabId = item.dataset.tab;
            if (tabId === currentActiveSection) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }


    // --- Event Listeners Principais ---

    // Listener para o formulário de ticket (Salvar)
    if(ticketForm) ticketForm.addEventListener('submit', saveTicket);

    // Listeners para abrir o modal (Botão no header e FAB)
    const openNewTicketModal = () => {
        console.log('Abrindo modal para novo ticket.');
        closeModal(); // Garante que nenhum modal esteja aberto antes
        // Pequeno delay antes de abrir o modal para novo ticket
        setTimeout(() => {
            openModal(); // Abre o modal
            modalTitle.textContent = 'Adicionar Novo Ticket'; // Define o título
            // Preenche datas padrão
            const today = formatDateInput(new Date());
            openDateInput.value = today;
            lastMovementDateInput.value = today;
            // Esconde histórico e limpa campos específicos para novo ticket
            if(historySection) historySection.style.display = 'none';
            ticketIdInput.value = ''; // Garante que o ID esteja vazio para indicar novo ticket
            ticketForm.reset(); // Reseta o formulário
            ticketStatusInput.value = 'pending'; // Status padrão para novo ticket
            // Limpa outros campos explicitamente para evitar preenchimento indesejado
            responsibleInput.value = '';
            clientNameInput.value = '';
            ticketNumberInput.value = '';
            ticketTitleInput.value = '';
            ticketDescriptionInput.value = '';
            nextActionDateInput.value = '';
            observationsInput.value = '';
            if(newHistoryEntryInput) newHistoryEntryInput.value = ''; // Limpa input de histórico
            if(ticketHistoryList) ticketHistoryList.innerHTML = ''; // Limpa lista de histórico
            if(noHistoryMessage) noHistoryMessage.style.display = 'block'; // Mostra mensagem de histórico vazio

            console.log('Modal preparado para novo ticket.');
        }, 350); // Delay para a animação de fechamento do modal
    };

    if(addTicketBtnMainHeader) addTicketBtnMainHeader.addEventListener('click', openNewTicketModal);
    if(fabAddTicketBtn) fabAddTicketBtn.addEventListener('click', openNewTicketModal);


    // Listeners para fechar o modal
    if(closeModalBtn) closeModalBtn.addEventListener('click', closeModal); // Botão 'X'
    if(cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal); // Botão 'Cancelar'

    // Listener para fechar o modal clicando fora dele
    window.addEventListener('click', (event) => {
        if (event.target === ticketModal) {
            console.log('Clique fora do modal. Fechando...');
            closeModal();
        }
    });

    // Listener para o botão de adicionar histórico
    if(addHistoryBtn) addHistoryBtn.addEventListener('click', addHistoryEntry);


    // Listeners para os filtros e barra de busca (Tickets Ativos)
    if(searchBar) searchBar.addEventListener('input', renderTickets);
    if(statusFilter) statusFilter.addEventListener('change', renderTickets);
    if(responsibleFilter) {
         responsibleFilter.addEventListener('change', () => {
             responsibleFilter.dataset.currentValue = responsibleFilter.value; // Salva o valor selecionado
             renderTickets();
         });
    }

     // Listeners para os filtros e barra de busca (Tickets Finalizados)
    if(searchBarResolved) searchBarResolved.addEventListener('input', renderTickets);
    if(responsibleFilterResolved) {
        responsibleFilterResolved.addEventListener('change', () => {
            responsibleFilterResolved.dataset.currentValue = responsibleFilterResolved.value; // Salva o valor selecionado
            renderTickets();
        });
    }


    // Listener para cliques nos containers de tickets (Delegação de Eventos)
    // Captura cliques nos botões de Editar, Excluir e Finalizar
    const handleTicketActionClick = (e) => {
        const target = e.target;
        const ticketCard = target.closest('.ticket-card'); // Encontra o card pai
        if (!ticketCard) return; // Se não clicou dentro de um card, sai

        const ticketId = ticketCard.dataset.id; // Pega o ID do card

        if (target.closest('.edit-btn')) {
            console.log('Clique no botão Editar para ticket ID:', ticketId);
            editTicket(ticketId);
        } else if (target.closest('.delete-btn')) {
             console.log('Clique no botão Excluir para ticket ID:', ticketId);
            deleteTicket(ticketId);
        } else if (target.closest('.resolve-btn')) {
             console.log('Clique no botão Finalizar para ticket ID:', ticketId);
            resolveTicket(ticketId);
        }
    };

    // Adiciona o listener aos containers de tickets ativos e finalizados
    if(activeTicketsContainer) activeTicketsContainer.addEventListener('click', handleTicketActionClick);
    if(resolvedTicketsContainer) resolvedTicketsContainer.addEventListener('click', handleTicketActionClick);


    // Listeners para os itens da navegação lateral
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = e.currentTarget.dataset.tab;
            displayContentSection(sectionId);
            updateActiveNavItem();
            // renderTickets() ou updateCharts() são chamados dentro de displayContentSection
        });
    });

    // Adiciona listener para o botão de logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('Clique em Sair.');
            window.logout(); // Chama a função de logout definida em auth.js
        });
    }


    // --- Inicialização do Sistema ---

    // Carrega os tickets salvos no LocalStorage ao carregar a página
    loadTickets();
    // Atualiza o dashboard com os dados carregados
    updateDashboard(); // Isso também chama populateResponsibleFilters, renderTickets e updateCharts
    // Exibe a seção de conteúdo inicial (Dashboard)
    displayContentSection(currentActiveSection);
    // Atualiza o item de navegação ativo
    updateActiveNavItem();


    // Configura um intervalo para atualizar o dashboard e renderizar tickets a cada 5 minutos
    // Isso garante que tickets "late" sejam atualizados automaticamente.
    setInterval(() => {
        console.log('Executando atualização periódica...');
        updateDashboard(); // Isso re-renderiza tickets e atualiza gráficos se as tabs estiverem ativas
    }, 5 * 60 * 1000); // 5 minutos * 60 segundos * 1000 milissegundos

    console.log('TRACKER TICKET inicializado com sucesso!');
});
