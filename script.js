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

 db.ref("motika_data").update({

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

 transacciones.forEach(t=>{

  if(t.tipo==="ingreso") ingresos += t.monto;
  if(t.tipo==="gasto") gastos += t.monto;

 });

 return ingresos - gastos;

}

function calcularInventarioCosto(){

 return productos.reduce((acc,p)=>{

  return acc + (p.costo * p.cantidad);

 },0);

}

function calcularInventarioVenta(){

 return productos.reduce((acc,p)=>{

  return acc + (p.precio * p.cantidad);

 },0);

}

function calcularDeudas(){

 return deudas.reduce((acc,d)=>{

  return acc + d.monto;

 },0);

}

function calcularGanancia(){

 let ventas = 0;
 let costo = 0;

 transacciones.forEach(t=>{

  if(t.tipo==="venta"){

   ventas += t.monto;
   costo += t.costo || 0;

  }

 });

 let gastos = transacciones
 .filter(t=>t.tipo==="gasto")
 .reduce((acc,g)=>acc + g.monto,0);

 return ventas - costo - gastos;

}

function calcularPatrimonio(){

 return calcularEfectivo()
 + calcularInventarioCosto()
 + calcularDeudas();

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

 producto.cantidad += cantidad;
 producto.costo = costo;

 if(precioVenta) producto.precio = precioVenta;

 }else{

 productos.push({

  id: Date.now(),
  nombre,
  cantidad,
  costo,
  precio: precioVenta || (costo * 1.3)

 });

 }

 compras.push({

  id: Date.now(),
  nombre,
  cantidad,
  costo,
  precioVenta,
  total,
  fecha: new Date().toLocaleDateString()

 });

 transacciones.push({

  id: Date.now()+1,
  tipo: "gasto",
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
  monto,
  costo,
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
PEDIDOS
========================= */

window.crearPedido = function(cliente,productosPedido){

 if(!cliente) return alert("Cliente requerido");

 if(!productosPedido || productosPedido.length===0)
 return alert("Debe agregar productos");

 pedidos.push({

  id: Date.now(),
  cliente,
  productos: productosPedido,
  fecha: new Date().toLocaleDateString()

 });

 actualizarTodo();

}

/* =========================
LISTA AUTOMATICA DE COMPRAS
========================= */

function generarListaCompras(){

 let lista = {};

 pedidos.forEach(p=>{

  p.productos.forEach(prod=>{

   if(!lista[prod.nombre]){

    lista[prod.nombre] = 0;

   }

   lista[prod.nombre] += prod.cantidad;

  });

 });

 return lista;

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
  cliente,
  monto,
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
  monto,
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
RENDER GENERAL
========================= */

function renderTodo(){

 renderDashboard();
 renderInventario();
 renderDeudas();

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
/* =========================
PREPARACION DE PEDIDOS
========================= */

let comprasRecientes = {};

/* registrar lo que se compro realmente */

window.registrarCompraLista = function(producto,cantidad){

 cantidad = parseInt(cantidad);

 if(!comprasRecientes[producto]){

  comprasRecientes[producto] = 0;

 }

 comprasRecientes[producto] += cantidad;

}

/* generar pantalla de preparacion */

function renderPrepararPedidos(){

 const cont = document.getElementById("panel-preparar");
 if(!cont) return;

 cont.innerHTML = "";

 pedidos.forEach(p=>{

 let html = `<div class="pedido-preparar">`;

 html += `<h3>${p.cliente}</h3>`;

 p.productos.forEach(prod=>{

 const disponible = comprasRecientes[prod.nombre] || 0;

 html += `

 <div>

 ${prod.nombre} ${prod.cantidad}

 <input type="number"
 value="0"
 min="0"
 max="${disponible}"
 id="entrega-${p.id}-${prod.nombre}">

 </div>

 `;

 });

 html += `

 <button onclick="entregarVenta(${p.id})">
 Entregar como venta
 </button>

 <button onclick="entregarDeudaPedido(${p.id})">
 Entregar como deuda
 </button>

 `;

 html += `</div>`;

 cont.innerHTML += html;

 });

}

/* entregar pedido como venta */

window.entregarVenta = function(id){

 const pedido = pedidos.find(p=>p.id===id);

 if(!pedido) return;

 pedido.productos.forEach(prod=>{

 const input = document.getElementById(
 `entrega-${id}-${prod.nombre}`
 );

 const cantidad = parseInt(input.value) || 0;

 if(cantidad<=0) return;

 const producto = productos.find(
 x=>x.nombre===prod.nombre
 );

 if(producto){

  venderProducto(producto.id,cantidad);

 }

 });

}

/* entregar como deuda */

window.entregarDeudaPedido = function(id){

 const pedido = pedidos.find(p=>p.id===id);

 if(!pedido) return;

 let total = 0;

 pedido.productos.forEach(prod=>{

 const input = document.getElementById(
 `entrega-${id}-${prod.nombre}`
 );

 const cantidad = parseInt(input.value) || 0;

 if(cantidad<=0) return;

 const producto = productos.find(
 x=>x.nombre===prod.nombre
 );

 if(producto){

  total += producto.precio * cantidad;

 }

 });

 if(total>0){

  registrarDeuda(pedido.cliente,total);

 }

}