console.log("Sistema MOTIKA V3 Profesional");

/* =========================
ESTADO GLOBAL
========================= */

let productos = [];
let transacciones = [];
let encargos = [];
let compras = [];
let historialReportes = [];

/* =========================
FUNCIONES NUMERICAS
========================= */

function limpiarNumero(valor){
 if(!valor) return 0;
 return parseFloat(valor.toString().replace(/\./g,'').replace(',','.')) || 0;
}

function formatearNumero(valor){
 return Number(valor || 0).toLocaleString('es-CO');
}

/* =========================
SINCRONIZACION FIREBASE
========================= */

db.ref("motika_data").on("value", snap=>{
 const data = snap.val();
 if(!data) return;

 productos = data.productos || [];
 transacciones = data.transacciones || [];
 encargos = data.encargos || [];
 compras = data.compras || [];
 historialReportes = data.historialReportes || [];

 renderTodo();
});

function actualizarTodo(){

 db.ref("motika_data").set({
  productos,
  transacciones,
  encargos,
  compras,
  historialReportes
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
  if(t.tipo === "ingreso") ingresos += t.monto;
  if(t.tipo === "gasto") gastos += t.monto;
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

 return encargos.reduce((acc,e)=>{
  return acc + (e.deuda || 0);
 },0);

}

function calcularGanancia(){

 let ventas = 0;
 let costoVentas = 0;

 transacciones.forEach(t=>{
  if(t.tipo === "venta"){
   ventas += t.monto;
   costoVentas += t.costo || 0;
  }
 });

 let gastos = transacciones
 .filter(t=>t.tipo==="gasto")
 .reduce((acc,g)=>acc + g.monto,0);

 return ventas - costoVentas - gastos;
}

function calcularPatrimonio(){

 const efectivo = calcularEfectivo();
 const inventario = calcularInventarioCosto();
 const deudas = calcularDeudas();

 return efectivo + inventario + deudas;
}

/* =========================
DASHBOARD
========================= */

function renderDashboard(){

 const efectivo = calcularEfectivo();
 const inventarioCosto = calcularInventarioCosto();
 const inventarioVenta = calcularInventarioVenta();
 const deudas = calcularDeudas();
 const patrimonio = calcularPatrimonio();
 const ganancia = calcularGanancia();

 setTexto("dash-efectivo", efectivo);
 setTexto("dash-inv-costo", inventarioCosto);
 setTexto("dash-inv-venta", inventarioVenta);
 setTexto("dash-deudas", deudas);
 setTexto("dash-patrimonio", patrimonio);
 setTexto("dash-ganancia", ganancia);

}

/* =========================
INVENTARIO
========================= */

function renderInventario(){

 const tabla = document.getElementById("tabla-inventario");
 if(!tabla) return;

 tabla.innerHTML = productos.map(p=>{

 const stockBajo = p.cantidad <= 3 ? "⚠️" : "";

 return `
 <tr>
 <td>${p.nombre}</td>
 <td>${p.cantidad} ${stockBajo}</td>
 <td>$${formatearNumero(p.costo)}</td>
 <td>$${formatearNumero(p.precio)}</td>

 <td>
 <button onclick="editarPrecio(${p.id})">💰</button>
 <button onclick="editarStock(${p.id})">✏️</button>
 <button onclick="eliminarProducto(${p.id})">❌</button>
 </td>
 </tr>

 `;

 }).join("");

}

window.editarStock = function(id){

 const p = productos.find(x=>x.id===id);
 const nuevo = prompt("Nuevo stock:",p.cantidad);

 if(nuevo===null) return;

 p.cantidad = parseInt(nuevo) || 0;

 actualizarTodo();
}

window.editarPrecio = function(id){

 const p = productos.find(x=>x.id===id);

 const nuevo = prompt("Nuevo precio venta:",p.precio);

 if(nuevo===null) return;

 p.precio = limpiarNumero(nuevo);

 actualizarTodo();
}

window.eliminarProducto = function(id){

 if(!confirm("Eliminar producto")) return;

 productos = productos.filter(p=>p.id!==id);

 actualizarTodo();
}

/* =========================
COMPRAS MERCANCIA
========================= */

window.registrarCompra = function(nombre,cantidad,costo){

 const total = cantidad * costo;

 const productoExistente = productos.find(p=>p.nombre.toLowerCase()===nombre.toLowerCase());

 if(productoExistente){

 productoExistente.cantidad += cantidad;
 productoExistente.costo = costo;

 }else{

 productos.push({
 id: Date.now(),
 nombre,
 cantidad,
 costo,
 precio: costo * 1.3
 });

 }

 compras.push({
 id: Date.now(),
 nombre,
 cantidad,
 costo,
 total,
 fecha: new Date().toLocaleDateString()
 });

 transacciones.push({
 id: Date.now()+1,
 tipo:"gasto",
 desc:"Compra mercancía",
 monto: total,
 fecha: new Date().toLocaleDateString()
 });

 actualizarTodo();
}

/* =========================
VENTAS
========================= */

window.venderProducto = function(productoId,cantidad){

 const p = productos.find(x=>x.id==productoId);

 if(!p) return alert("Producto no existe");

 if(p.cantidad < cantidad) return alert("Stock insuficiente");

 p.cantidad -= cantidad;

 const monto = p.precio * cantidad;
 const costo = p.costo * cantidad;

 transacciones.push({
 id: Date.now(),
 tipo:"venta",
 desc:`Venta ${p.nombre}`,
 monto,
 costo,
 fecha:new Date().toLocaleDateString()
 });

 actualizarTodo();
}

/* =========================
BUSQUEDA PRODUCTOS
========================= */

window.buscarProductos = function(texto){

 const lista = document.getElementById("lista-sugerencias");
 if(!lista) return;

 lista.innerHTML="";

 if(texto.length < 1) return;

 productos
 .filter(p=>p.nombre.toLowerCase().includes(texto.toLowerCase()))
 .forEach(p=>{

 const div = document.createElement("div");

 div.innerText = `${p.nombre} ($${p.precio})`;

 div.onclick = ()=>{
 seleccionarProducto(p.id);
 };

 lista.appendChild(div);

 });

}

/* =========================
DEUDAS
========================= */

window.abonarDeuda = function(id,monto){

 const e = encargos.find(x=>x.id===id);

 if(!e) return;

 if(monto > e.deuda) return alert("Monto mayor a deuda");

 e.deuda -= monto;

 transacciones.push({
 id: Date.now(),
 tipo:"ingreso",
 desc:`Abono ${e.cliente}`,
 monto,
 fecha:new Date().toLocaleDateString()
 });

 actualizarTodo();
}

/* =========================
RENDER GENERAL
========================= */

function renderTodo(){

 renderDashboard();
 renderInventario();

}

/* =========================
UTILIDADES UI
========================= */

function setTexto(id,valor){

 const el = document.getElementById(id);
 if(!el) return;

 el.innerText = "$" + formatearNumero(valor);
}