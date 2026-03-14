console.log("Sistema MOTIKA V4 Profesional");

/* =========================
ESTADO GLOBAL
========================= */

let productos = [];
let transacciones = [];
let compras = [];
let pedidos = [];
let deudas = [];
let historialReportes = [];

/* =========================
FUNCIONES NUMERICAS
========================= */

function limpiarNumero(valor){

 if(!valor) return 0;

 return parseFloat(
  valor.toString()
  .replace(/\./g,'')
  .replace(',','.')
 ) || 0;

}

function formatearNumero(valor){

 return Number(valor || 0).toLocaleString('es-CO');

}

/* =========================
ESPERAR FIREBASE
========================= */

function iniciarFirebase(){

 if(typeof db === "undefined"){

  setTimeout(iniciarFirebase,500);
  return;

 }

 console.log("Firebase conectado");

 db.ref("motika_data").on("value", snap=>{

  console.log("Datos recibidos:", snap.val());

  const data = snap.val() || {};

  productos = data.productos || [];
  transacciones = data.transacciones || [];
  compras = data.compras || [];
  pedidos = data.pedidos || [];
  deudas = data.deudas || [];
  historialReportes = data.historialReportes || [];

  console.log("Productos cargados:", productos);

  renderTodo();

 });

}

iniciarFirebase();

/* =========================
GUARDAR TODO
========================= */

function actualizarTodo(){

 db.ref("motika_data").set({

  productos: productos,
  transacciones: transacciones,
  compras: compras,
  pedidos: pedidos,
  deudas: deudas,
  historialReportes: historialReportes

 });

 renderTodo();

}

/* =========================
CALCULOS FINANCIEROS
========================= */

function calcularEfectivo(){

 let ingresos = 0;
 let gastos = 0;
 let compras = 0;

 transacciones.forEach(t=>{

  if(t.tipo==="ingreso" || t.tipo==="venta"){
   ingresos += limpiarNumero(t.monto);
  }

  if(t.tipo==="gasto"){
   gastos += limpiarNumero(t.monto);
  }

  if(t.tipo==="compra"){
   compras += limpiarNumero(t.monto);
  }

 });

 return ingresos - gastos - compras;

}

function calcularInventarioCosto(){

 return productos.reduce((acc,p)=>{

  return acc + (limpiarNumero(p.costo) * limpiarNumero(p.cantidad));

 },0);

}

function calcularInventarioVenta(){

 return productos.reduce((acc,p)=>{

  return acc + (limpiarNumero(p.precio) * limpiarNumero(p.cantidad));

 },0);

}

function calcularDeudas(){

 return deudas.reduce((acc,d)=>{

  return acc + limpiarNumero(d.monto);

 },0);

}

function calcularGanancia(){

 let ventas = 0;
 let costo = 0;

 transacciones.forEach(t=>{

  if(t.tipo==="venta"){

   ventas += limpiarNumero(t.monto);
   costo += limpiarNumero(t.costo);

  }

 });

 return ventas - costo;

}

function calcularPatrimonio(){

 return calcularEfectivo()
 + calcularInventarioCosto();

}

/* =========================
DASHBOARD
========================= */

function renderDashboard(){

 setTexto("dash-efectivo",calcularEfectivo());
 setTexto("dash-inv-costo",calcularInventarioCosto());
 setTexto("dash-inv-venta",calcularInventarioVenta());
 setTexto("dash-deudas",calcularDeudas());
 setTexto("dash-ganancia",calcularGanancia());
 setTexto("dash-patrimonio",calcularPatrimonio());

}

/* =========================
INVENTARIO
========================= */

function renderInventario(){

 const tabla = document.getElementById("tabla-inventario");
 if(!tabla) return;

 tabla.innerHTML = productos.map(p=>{

 const alerta = p.cantidad <= 3 ? "⚠️" : "";

 return `

 <tr>

 <td>${p.nombre}</td>
 <td>${p.cantidad} ${alerta}</td>
 <td>$${formatearNumero(p.costo)}</td>
 <td>$${formatearNumero(p.precio)}</td>

 <td>

 <button onclick="editarPrecio(${p.id})">Precio</button>
 <button onclick="editarStock(${p.id})">Stock</button>
 <button onclick="eliminarProducto(${p.id})">Eliminar</button>

 </td>

 </tr>

 `;

 }).join("");

}
/* =========================
EDITAR PRECIO
========================= */

window.editarPrecio = function(id){

 const p = productos.find(x=>Number(x.id)===Number(id));

 if(!p) return;

 const nuevo = prompt("Nuevo precio de venta:",p.precio);

 if(nuevo===null) return;

 p.precio = limpiarNumero(nuevo);

 actualizarTodo();

}

/* =========================
EDITAR STOCK
========================= */

window.editarStock = function(id){

 const p = productos.find(x=>Number(x.id)===Number(id));

 if(!p) return;

 const nuevo = prompt("Nuevo stock:",p.cantidad);

 if(nuevo===null) return;

 p.cantidad = parseInt(nuevo) || 0;

 actualizarTodo();

}

/* =========================
ELIMINAR PRODUCTO
========================= */

window.eliminarProducto = function(id){

 if(!confirm("Eliminar producto")) return;

 productos = productos.filter(p=>p.id!==id);

 actualizarTodo();

}

/* =========================
REGISTRAR COMPRA
========================= */

window.registrarCompra = function(nombre,cantidad,costo,precioVenta){

 if(!nombre) return alert("Nombre requerido");

 cantidad = parseInt(cantidad);
 costo = limpiarNumero(costo);
 precioVenta = limpiarNumero(precioVenta);

 if(!cantidad || !costo) return alert("Datos inválidos");

 const total = cantidad * costo;

 let producto = productos.find(
 p=>p.nombre.toLowerCase()===nombre.toLowerCase()
 );

 if(producto){

  const cantidadAnterior = limpiarNumero(producto.cantidad);
const costoAnterior = limpiarNumero(producto.costo);

const valorAnterior = cantidadAnterior * costoAnterior;
const valorCompra = cantidad * costo;

const nuevaCantidad = cantidadAnterior + cantidad;

const nuevoCostoPromedio =
 Math.round((valorAnterior + valorCompra) / nuevaCantidad);

producto.cantidad = nuevaCantidad;
producto.costo = nuevoCostoPromedio;

if(precioVenta){
 producto.precio = precioVenta;
}

 }else{

  productos.push({

   id: Date.now(),
   nombre: nombre,
   cantidad: cantidad,
   costo: costo,
   precio: precioVenta || (costo * 1.3)

  });

 }

 compras.push({

  id: Date.now(),
  nombre: nombre,
  cantidad: cantidad,
  costo: costo,
  precioVenta: precioVenta,
  total: total,
  fecha: new Date().toLocaleDateString()

 });

 transacciones.push({

  id: Date.now()+1,
  tipo: "compra",
  desc: "Compra mercancía",
  monto: total,
  fecha: new Date().toLocaleDateString()

 });

 actualizarTodo();

}

/* =========================
VENTAS
========================= */

window.venderProducto = function(id,cantidad){

 cantidad = parseInt(cantidad);

 const p = productos.find(x=>Number(x.id)===Number(id));

 if(!p) return alert("Producto no existe");

 if(!cantidad) return alert("Cantidad inválida");

 if(p.cantidad < cantidad)
 return alert("Stock insuficiente");

 p.cantidad -= cantidad;

 const monto = p.precio * cantidad;
 const costo = p.costo * cantidad;

 transacciones.push({

  id: Date.now(),
  tipo: "venta",
  desc: p.nombre,
  monto: monto,
  costo: costo,
  fecha: new Date().toLocaleDateString()

 });

 actualizarTodo();

}

/* =========================
BUSCAR PRODUCTOS PARA VENTA
========================= */

window.buscarProductos = function(texto){

 const lista = document.getElementById("lista-sugerencias");
 if(!lista) return;

 lista.innerHTML = "";

 if(!texto) return;

 const encontrados = productos.filter(p=>
 p.nombre.toLowerCase().includes(texto.toLowerCase())
 );

 encontrados.forEach(p=>{

 const div = document.createElement("div");

 div.innerText =
 `${p.nombre} - $${formatearNumero(p.precio)}`;

 div.onclick = ()=>{

  productoSeleccionado = p.id;

  lista.innerHTML =
  `<b>${p.nombre}</b> seleccionado`;

 };

 lista.appendChild(div);

 });

}

/* =========================
PRODUCTO SELECCIONADO
========================= */

let productoSeleccionado = null;

/* =========================
FORMULARIO VENTA
========================= */

const formVenta = document.getElementById("form-venta");

if(formVenta){

 formVenta.addEventListener("submit", e=>{

  e.preventDefault();

  if(!productoSeleccionado)
  return alert("Seleccione producto");

  const cantidad =
  document.getElementById("venta-cantidad").value;

  venderProducto(productoSeleccionado,cantidad);

  productoSeleccionado = null;

  formVenta.reset();

  const lista =
  document.getElementById("lista-sugerencias");

  if(lista) lista.innerHTML = "";

 });

}

/* =========================
CREAR PEDIDO
========================= */

window.crearPedido = function(cliente,productosPedido){

 if(!cliente) return alert("Cliente requerido");

 if(!productosPedido || productosPedido.length===0)
 return alert("Debe agregar productos");

 pedidos.push({

  id: Date.now(),
  cliente: cliente,
  productos: [...productosPedido],
  fecha: new Date().toLocaleDateString()

 });

 actualizarTodo();

}

/* =========================
LISTA DE COMPRAS TIPO SUPER
========================= */

function generarListaCompras(){

 let lista = {};

(pedidos || []).forEach(p=>{

  if(!p.productos) return;

(p.productos || []).forEach(prod=>{

   if(!lista[prod.nombre]){
    lista[prod.nombre] = 0;
   }

   lista[prod.nombre] += parseInt(prod.cantidad) || 0;

  });

 });

 return lista;

}

/* =========================
RENDER LISTA COMPRAS
========================= */
function renderListaCompras(){

 const cont = document.getElementById("contenedor-lista-compras");
 if(!cont) return;

 const lista = generarListaCompras();

 let pendientes = "";
 let comprados = "";

 Object.keys(lista).forEach(nombre=>{

  const item = `

  <label class="item-compra">

  <input type="checkbox" onchange="marcarCompra(this)">

  ${nombre} (${lista[nombre]})

  </label>

  `;

  pendientes += item;

 });

 cont.innerHTML = `

 <div class="grid-compras">

 <div class="columna">
 <h3>🛒 Falta comprar</h3>
 <div id="pendientes">
 ${pendientes}
 </div>
 </div>

 <div class="columna">
 <h3>✔ Comprado</h3>
 <div id="comprados"></div>
 </div>

 </div>

 <button onclick="limpiarComprados()" class="btn-limpiar">
 Limpiar lista
 </button>

 `;

}
function marcarCompra(check){

 const item = check.parentElement;

 const comprados = document.getElementById("comprados");
 const pendientes = document.getElementById("pendientes");

 if(check.checked){

  comprados.appendChild(item);

 }else{

  pendientes.appendChild(item);

 }

}
function limpiarComprados(){

 const comprados = document.getElementById("comprados");

 if(!comprados) return;

 comprados.innerHTML = "";

}

/* =========================
REGISTRAR DEUDA
========================= */

window.registrarDeuda = function(cliente,monto){

 if(!cliente) return alert("Cliente requerido");

 monto = limpiarNumero(monto);

 if(!monto) return alert("Monto inválido");

 deudas.push({

  id: Date.now(),
  cliente: cliente,
  monto: monto,
  fecha: new Date().toLocaleDateString()

 });

 actualizarTodo();

}

/* =========================
ABONAR DEUDA
========================= */

window.abonarDeuda = function(id,monto){

 const d = deudas.find(x=>x.id===id);

 if(!d) return;

 monto = limpiarNumero(monto);

 if(!monto) return;

 if(monto > d.monto)
 return alert("El abono supera la deuda");

 d.monto -= monto;

 transacciones.push({

  id: Date.now(),
  tipo: "ingreso",
  desc: "Abono deuda " + d.cliente,
  monto: monto,
  fecha: new Date().toLocaleDateString()

 });

 if(d.monto <= 0){

  deudas = deudas.filter(x=>x.id!==id);

 }

 actualizarTodo();

}

/* =========================
RENDER DE DEUDAS
========================= */

function renderDeudas(){

 const tabla = document.getElementById("tabla-deudas");

 if(!tabla) return;

 tabla.innerHTML = deudas.map(d=>{

 return `

 <tr>

 <td>${d.cliente}</td>

 <td>$${formatearNumero(d.monto)}</td>

 <td>

 <button onclick="abonarPrompt(${d.id})">
 Abonar
 </button>

 </td>

 </tr>

 `;

 }).join("");

}

window.abonarPrompt = function(id){

 const monto = prompt("Monto a abonar:");

 if(monto===null) return;

 abonarDeuda(id,monto);

}

/* =========================
FORMULARIO DEUDA
========================= */

const formDeuda = document.getElementById("form-deuda");

if(formDeuda){

 formDeuda.addEventListener("submit", e=>{

  e.preventDefault();

  const cliente =
  document.getElementById("deuda-cliente").value;

  const monto =
  document.getElementById("deuda-monto").value;

  registrarDeuda(cliente,monto);

  formDeuda.reset();

 });

}

/* =========================
ENTREGA DE PEDIDOS
========================= */

function renderEntregarPedidos(){

 const cont = document.getElementById("panel-entregar");

 if(!cont) return;

 cont.innerHTML = "";

 (pedidos || []).forEach(p=>{

 let html = `<div class="pedido-entrega">`;

 html += `<h3>${p.cliente}</h3>`;

(p.productos || []).forEach(prod=>{

 html += `

 <div class="fila-pedido">

 ${prod.nombre} (${prod.cantidad})

<button onclick="entregarProducto('${p.id}','${prod.nombre}',${prod.cantidad})">
 Entregar
</button>

<button onclick="dejarDeuda('${p.id}','${prod.nombre}',${prod.cantidad})">
 Deuda
</button>

 </div>

 `;

 });

 html += `</div>`;

 cont.innerHTML += html;

 });

}

/* =========================
ENTREGAR PRODUCTO
========================= */

window.entregarProducto = function(pedidoId,nombre,cantidad){

 const producto = productos.find(
p=>p.nombre.toLowerCase() === nombre.toLowerCase()
);

 if(!producto){
  alert("Producto no existe en inventario");
  return;
 }

 if(producto.cantidad < cantidad){
  alert("No hay suficiente stock");
  return;
 }

 const pedido = pedidos.find(p=>String(p.id)===String(pedidoId));

 if(!pedido) return;

 venderProducto(producto.id,cantidad);

 pedido.productos = pedido.productos.filter(
  p=>p.nombre !== nombre
 );

 if(pedido.productos.length === 0){
  pedidos = pedidos.filter(p=>p.id !== pedidoId);
 }

 actualizarTodo();

}
window.dejarDeuda = function(pedidoId,nombre,cantidad){

 const producto = productos.find(
p=>p.nombre.toLowerCase() === nombre.toLowerCase()
);

 if(!producto){
  alert("Producto no existe en inventario");
  return;
 }

 const pedido = pedidos.find(p=>String(p.id)===String(pedidoId));

 if(!pedido) return;

 const monto = producto.precio * cantidad;

 registrarDeuda(pedido.cliente,monto);

 pedido.productos = pedido.productos.filter(
  p=>p.nombre !== nombre
 );

 if(pedido.productos.length === 0){
  pedidos = pedidos.filter(p=>p.id !== pedidoId);
 }

 actualizarTodo();

}
/* =========================
RENDER GENERAL
========================= */

function renderTodo(){

 renderDashboard();
 renderInventario();
 renderDeudas();
 renderListaCompras();
 renderEntregarPedidos();

}

/* =========================
UTILIDADES UI
========================= */

function setTexto(id,valor){

 const el = document.getElementById(id);

 if(!el) return;

 el.innerText = "$" + formatearNumero(valor);

}

/* =========================
NAVEGACION ENTRE SECCIONES
========================= */

function showSection(id){

 document.querySelectorAll("section").forEach(sec=>{
  sec.classList.remove("active");
 });

 const s = document.getElementById(id);

 if(s) s.classList.add("active");

}
const btnOscuro = document.getElementById("modo-oscuro");

if(btnOscuro){

btnOscuro.onclick = function(){

document.body.classList.toggle("dark");

if(document.body.classList.contains("dark")){
localStorage.setItem("modoOscuro","activo");
}else{
localStorage.setItem("modoOscuro","inactivo");
}

};

}
if("serviceWorker" in navigator){

navigator.serviceWorker.register("./sw.js")
.then(()=>{

console.log("Service Worker activo");

});

}
/* =========================
CARGAR MODO OSCURO
========================= */

if(localStorage.getItem("modoOscuro") === "activo"){
document.body.classList.add("dark");
}

/* =========================
MODO ADMIN OCULTO
========================= */

let contadorToques = 0;

const logo = document.getElementById("logo-motika");
const botonReset = document.getElementById("reset-sistema");

if(logo){

logo.addEventListener("click",()=>{

contadorToques++;

if(contadorToques >= 5){

alert("Modo administrador activado");

botonReset.style.display = "block";

}

setTimeout(()=>{

contadorToques = 0;

},2000);

});

}
/* =========================
MODO ADMIN (BOTON SECRETO)
========================= */
let presionTimer;
let modoAdmin = false;

const botonLuna = document.getElementById("modo-oscuro");

botonLuna.addEventListener("touchstart",()=>{

presionTimer = setTimeout(()=>{

modoAdmin = !modoAdmin;

if(modoAdmin){

document.getElementById("reset-sistema").style.display="inline-block";
document.getElementById("reiniciar-sistema").style.display="inline-block";
alert("Modo administrador activado");

}else{

document.getElementById("reset-sistema").style.display="none";
document.getElementById("reiniciar-sistema").style.display="none";

alert("Modo administrador desactivado");

}

},3000);

});

botonLuna.addEventListener("touchend",()=>{
clearTimeout(presionTimer);
});

window.resetSistema = function(){

 if(!confirm("Esto borrará TODOS los datos del sistema")) return;

 db.ref("motika_data").set({

  productos: [],
  transacciones: [],
  compras: [],
  pedidos: [],
  deudas: [],
  historialReportes: []

 }).then(()=>{

  productos = [];
  transacciones = [];
  compras = [];
  pedidos = [];
  deudas = [];
  historialReportes = [];

  renderTodo();

  alert("Sistema reiniciado");

 });

}

window.reiniciarSistema = function(){

 if(!confirm("Reiniciar sistema sin borrar datos?")) return;

 location.reload();

}