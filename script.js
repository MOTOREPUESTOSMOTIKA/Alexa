document.addEventListener('DOMContentLoaded', () => {

    const productos = JSON.parse(localStorage.getItem("productos")) || [];
    const contenedor = document.getElementById("productos");
    const btnComprar = document.getElementById("btnComprar");
    const buscador = document.getElementById("buscador");
    const filtroCategoria = document.getElementById("filtroCategoria");

    const btnAbrirCarrito = document.getElementById("btnAbrirCarrito");
    const carritoPanel = document.getElementById("carrito");
    const listaCarrito = document.getElementById("listaCarrito");


    let carrito = [];

    // ===== ABRIR / CERRAR CARRITO =====
    btnAbrirCarrito.onclick = () => {
        carritoPanel.classList.toggle("abierto");
    };

    // ===== CERRAR AL HACER CLICK FUERA =====
    document.addEventListener("click", (e) => {
        if (
            carritoPanel.classList.contains("abierto") &&
            !carritoPanel.contains(e.target) &&
            e.target !== btnAbrirCarrito
        ) {
            carritoPanel.classList.remove("abierto");
        }
    });

    // ===== CERRAR AL HACER PEDIDO =====
    btnComprar.onclick = () => {
        carritoPanel.classList.remove("abierto");
    };

});

    const categorias = [...new Set(productos.map(p => p.categoria))];
    categorias.forEach(cat => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        filtroCategoria.appendChild(option);
    });

    function mostrarProductos(lista) {
        contenedor.innerHTML = "";
        lista.forEach(p => {
            const div = document.createElement("div");
            div.className = "producto";
            div.innerHTML = `
                <img src="${p.imagen}">
                <div class="producto-info">
                    <h3>${p.nombre}</h3>
                    <div class="precio">${p.precio}</div>
                    <button>Agregar al carrito</button>
                </div>
            `;
            div.querySelector("button").onclick = () => {
                carrito.push(p);
                mostrarCarrito();
            };
            contenedor.appendChild(div);
        });
    }

    function mostrarCarrito() {
        listaCarrito.innerHTML = "";
        let mensaje = "Hola, quiero comprar:%0A";

        carrito.forEach(p => {
            listaCarrito.innerHTML += `<div>${p.nombre} - ${p.precio}</div>`;
            mensaje += `- ${p.nombre} (${p.precio})%0A`;
        });

        btnComprar.href = `https://wa.me/573118612727?text=${mensaje}`;
    }

    mostrarProductos(productos);

    filtroCategoria.addEventListener("change", () => {
        if (filtroCategoria.value === "todas") {
            mostrarProductos(productos);
        } else {
            mostrarProductos(productos.filter(p => p.categoria === filtroCategoria.value));
        }
    });

    buscador.addEventListener("keyup", () => {
        const texto = buscador.value.toLowerCase();
        mostrarProductos(productos.filter(p =>
            p.nombre.toLowerCase().includes(texto)
        ));
    });



