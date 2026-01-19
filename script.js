// --- CONFIGURACIÓN ---
const API_URL = "https://script.google.com/macros/s/AKfycbzUcZtNs6nThWdY0rJVF7xfdlRSrEYs3sFM4m_UPkguFNIDavwIDHbRzcMCAt5R8ZpDYQ/exec";

// --- DATA DE PROYECTOS (Requerimiento 1: Escalable) ---
const projectsDB = [
    {
        title: "Glamping Cuántico",
        desc: "Unidades habitacionales eco-sostenibles con integración IoT.",
        img: "https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?q=80&w=2070&auto=format&fit=crop",
        status: "En Operación"
    },
    {
        title: "Club House Morelia",
        desc: "Centro recreativo y de networking para la comunidad SEMO.",
        img: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2070&auto=format&fit=crop",
        status: "Preventa"
    },
    {
        title: "Torre Empresarial",
        desc: "Edificio inteligente sede de operaciones y coworking.",
        img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?q=80&w=2070&auto=format&fit=crop",
        status: "Planeación"
    }
];

// --- ESTADO DEL JUEGO ---
let state = {
    balance: 100,
    share: 0,
    assets: 0,
    isVip: false // Estado para diferenciar Demo vs Pagado
};

// --- INICIALIZACIÓN ---
window.onload = function () {
    renderProjects();
    actualizarContador();
};

function actualizarContador() {
    fetch(API_URL + '?action=checkStatus')
        .then(response => response.json())
        .then(data => {
            // Checking for "result" based on user request/backend update
            if (data.result === "success") {
                const vendidos = data.sold;
                const meta = 1000;
                const porcentaje = (vendidos / meta) * 100;

                // Actualizar el texto
                const contadorEl = document.getElementById('contador-actual');
                if (contadorEl) contadorEl.innerText = vendidos;

                // Actualizar la barra visual
                const barraEl = document.getElementById('barra-progreso');
                if (barraEl) barraEl.style.width = porcentaje + "%";
            }
        })
        .catch(err => {
            console.error("Error al cargar contador:", err);
            const contadorEl = document.getElementById('contador-actual');
            // Valor fallback visual si falla (ej. CORS local)
            if (contadorEl) contadorEl.innerText = "Error (Red)";
        });
}

function renderProjects() {
    const container = document.getElementById('realProjectsContainer');
    if (!container) return;

    let html = '';
    projectsDB.forEach(p => {
        html += `
        <div class="real-project-card">
            <div class="project-img" style="background-image: url('${p.img}')"></div>
            <div class="project-body">
                <h3>${p.title}</h3>
                <p>${p.desc}</p>
                <span class="status-badge">${p.status}</span>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function toggleMode() {
    const isChecked = document.getElementById('realityToggle').checked;
    document.body.className = isChecked ? 'mode-tycoon' : 'mode-real-estate';
    // Mantener estado VIP si existe
    if (state.isVip) document.body.classList.add('is-vip');
}

// --- LÓGICA DE JUEGO & ADMIN ---
function updateHUD() {
    document.getElementById('balanceDisplay').innerText = Math.floor(state.balance);
    document.getElementById('shareDisplay').innerText = state.share.toFixed(1) + "%";
    document.getElementById('assetsDisplay').innerText = state.assets;
}

function buyAsset(name, cost, shareVal) {
    if (state.balance >= cost) {
        state.balance -= cost;
        state.share += shareVal;
        state.assets++;
        updateHUD();
        log(`ADQUISICIÓN: ${name}. Participación +${shareVal}%`);
    } else {
        alert("❌ Saldo insuficiente. Espera a que el ADMIN inyecte capital o activa tu cuenta.");
    }
}

function triggerAdminInjection() {
    // 1. Obtener cantidad del input
    const amountInput = document.getElementById('adminAmount');
    const totalInjection = parseFloat(amountInput.value);

    if (!totalInjection || totalInjection <= 0) {
        alert("Ingresa un monto válido mayor a 0.");
        return;
    }

    if (state.share <= 0) {
        log(`⚠️ ADMIN INYECTÓ ${totalInjection}, pero no tienes participación (0%). ¡Invierte!`);
        return;
    }

    // 2. Cálculo Equitativo: (Inyección Total * Mi Porcentaje) / 100
    const myCut = Math.floor((totalInjection * state.share) / 100);

    state.balance += myCut;
    updateHUD();
    log(`📢 INYECCIÓN DE CAPITAL: $${totalInjection}. Recibes: $${myCut} (Por tu ${state.share}%)`);
}

function log(msg) {
    const l = document.getElementById('gameLog');
    if (!l) return;
    l.innerText = "> " + msg;
    l.style.color = "#fff"; setTimeout(() => l.style.color = "#0f0", 300);
}

// --- SEGURIDAD ADMIN ---
function unlockAdmin() {
    const pwd = prompt("🔐 ADMIN ACCESS\nPassword:");
    if (pwd === "SEMO2026") {
        document.getElementById('adminPanel').style.display = "block";
    } else { alert("Acceso Denegado"); }
}
function hideAdmin() { document.getElementById('adminPanel').style.display = "none"; }

// --- MODAL & PAGO LOGIC ---
function openModal() { document.getElementById('authModal').style.display = "block"; }
function closeModal() { document.getElementById('authModal').style.display = "none"; }

// Logic from Payment Code
function showTab(id) {
    // Select all contents and buttons within the modal
    const modal = document.getElementById('authModal');
    modal.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    document.getElementById(id).classList.add('active');

    // Find the button that triggered this function - simpler to just look up by onclick attribute or re-select
    // For simplicity, we assume the click event is passed or we find the button that calls this
    // We can also find the button by text content or similar, but let's use a simpler approach:
    // We will attach the event listener in HTML using onclick="showTab('id', this)"
    // or just search for the button that corresponds.
    const buttons = modal.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if (btn.getAttribute('onclick').includes(id)) {
            btn.classList.add('active');
        }
    });
}

async function handlePaymentSubmit(e) {
    e.preventDefault();
    const btn = document.querySelector('#pagoSemoForm .btn-submit');
    const msg = document.getElementById('msg');

    // UI Loading State
    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = "⏳ VALIDANDO MISIÓN...";
    msg.innerHTML = "Conectando con el servidor...";
    msg.style.color = "#ccc";

    const body = {
        action: "registerSale",
        nombre: document.getElementById('nombre').value,
        correo: document.getElementById('correo').value,
        cantidad: document.getElementById('cantidad').value,
        metodo: document.getElementById('metodo').value,
        txHash: document.getElementById('txHash').value,
        referido: "Web Directa"
    };

    console.log("📦 Enviando datos al servidor:", body); // Debug log

    try {
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            body: JSON.stringify(body)
        });

        // Succcess Handling
        msg.style.color = "#00ff88";
        msg.innerHTML = "✅ ¡Misión enviada! <br> Activando protocolos de inversión...";

        // --- Activate VIP Mode (Game Transition) ---
        setTimeout(() => {
            activateVIPMode(body.nombre, body.cantidad);
            document.getElementById('pagoSemoForm').reset();
            btn.disabled = false;
            btn.innerText = originalText;
            closeModal();
        }, 2000);

    } catch (error) {
        console.error(error);
        msg.style.color = "red";
        msg.innerHTML = "❌ Error al conectar. Intenta de nuevo.";
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

function activateVIPMode(name, amount) {
    state.isVip = true;
    document.body.classList.add('is-vip'); // Activa estilos dorados

    // Actualizar UI
    const nameDisplay = document.getElementById('userNameDisplay');
    const rankIcon = document.getElementById('userRankIcon');

    if (nameDisplay && rankIcon) {
        nameDisplay.innerHTML = `⭐ ${name} (Inversionista)`;
        nameDisplay.style.color = "var(--gold)";
        rankIcon.innerText = "🏆";
    }

    // Cambiar el Botón de Venta
    const ctaBtn = document.getElementById('ctaBtn');
    const ctaText = document.getElementById('ctaText');

    if (ctaBtn) {
        ctaBtn.innerText = "ACCEDER A GOBERNANZA AIIO";
        ctaBtn.onclick = function () { alert("Bienvenido al panel de votación (Próximamente)"); };
    }
    if (ctaText) {
        ctaText.innerText = `Capital Semilla Activo ($${amount}). Tienes poder de voto.`;
    }

    alert(`¡TRANSICIÓN EXITOSA! 🌌\n\nBienvenido, ${name}.\nHas invertido $${amount} USD.\nTu interfaz ha evolucionado al modo Inversionista.`);
}
