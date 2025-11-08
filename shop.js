// ---------- CONFIG (à personnaliser) ----------
const STORE_NAME = "Produitapetit prix emergent";
const CURRENCY = "€";

// ***** IMPORTANT : crée un Google Form et colle ici son URL d'action (voir README ci-dessus) *****
const GOOGLE_FORM_ACTION_URL = "https://docs.google.com/forms/d/e/TA_FORM_ID/formResponse";
// Remplace la valeur ci-dessus par l'URL d'action complète de ton Google Form (celle qui finit par /formResponse).
// -----------------------------------------------------------------------

// Catalogue (modifie les titres / images / prix)
const PRODUCTS = [
  { id: "p1", title: "Mini-projecteur Full HD", price: 49.90, img: "https://via.placeholder.com/400x300?text=Mini-projecteur" },
  { id: "p2", title: "Écouteurs Bluetooth Supersound", price: 24.50, img: "https://via.placeholder.com/400x300?text=%C3%89couteurs" },
  { id: "p3", title: "Station de charge 3-en-1", price: 19.90, img: "https://via.placeholder.com/400x300?text=Chargeur+3-en-1" }
];

// ---------- State ----------
let cart = {};

// ---------- Utils ----------
function formatPrice(p){ return p.toFixed(2) + " " + CURRENCY }
function saveCart(){ localStorage.setItem("pap_cart", JSON.stringify(cart)) }
function loadCart(){ try{cart=JSON.parse(localStorage.getItem("pap_cart"))||{}}catch(e){cart={}} }
function updateCartCount(){ const n = Object.values(cart).reduce((s,i)=>s+i.qty,0); document.getElementById("cart-count").textContent = n }
function cartTotal(){ return Object.values(cart).reduce((s,i)=> s + i.qty * i.price, 0) }

// ---------- Render ----------
function renderProducts(){
  const el = document.getElementById("products")
  el.innerHTML = ""
  PRODUCTS.forEach(p=>{
    const card = document.createElement("div"); card.className="card"
    card.innerHTML = `
      <img src="${p.img}" alt="${p.title}">
      <h3>${p.title}</h3>
      <p>${p.title}</p>
      <div class="price">${formatPrice(p.price)}</div>
      <button data-id="${p.id}">Ajouter au panier</button>
    `
    el.appendChild(card)
  })
  el.addEventListener("click", e=>{
    const btn = e.target.closest("button")
    if(!btn) return
    const id = btn.getAttribute("data-id")
    addToCart(id)
  })
}

function renderCart(){
  const area = document.getElementById("cart-items")
  area.innerHTML = ""
  if(Object.keys(cart).length===0){ area.innerHTML = "<p>Ton panier est vide</p>"; document.getElementById("cart-total").textContent = formatPrice(0); return }
  for(const id in cart){
    const it = cart[id]
    const row = document.createElement("div")
    row.style.display="flex"; row.style.justifyContent="space-between"; row.style.marginBottom="8px"
    row.innerHTML = `<div><strong>${it.title}</strong><div style="color:#666;font-size:13px">${it.qty} x ${formatPrice(it.price)}</div></div>
      <div>
        <button data-action="dec" data-id="${id}">-</button>
        <button data-action="inc" data-id="${id}">+</button>
        <button data-action="del" data-id="${id}">✕</button>
      </div>`
    area.appendChild(row)
  }
  document.getElementById("cart-total").textContent = formatPrice(cartTotal())
  area.addEventListener("click", e=>{
    const btn = e.target.closest("button")
    if(!btn) return
    const id = btn.getAttribute("data-id")
    const action = btn.getAttribute("data-action")
    if(action==="inc") cart[id].qty++
    if(action==="dec"){ cart[id].qty = Math.max(1, cart[id].qty-1) }
    if(action==="del"){ delete cart[id] }
    saveCart(); renderCart(); updateCartCount()
  })
}

// ---------- Cart actions ----------
function addToCart(id){
  const p = PRODUCTS.find(x=>x.id===id); if(!p) return
  if(cart[id]) cart[id].qty++ ; else cart[id] = { id:p.id, title:p.title, price:p.price, qty:1 }
  saveCart(); renderCart(); updateCartCount(); openCart()
}

function openCart(){ document.getElementById("cart").classList.remove("cart-hidden") }
function closeCart(){ document.getElementById("cart").classList.add("cart-hidden") }

// ---------- Checkout ----------
function openCheckout(){
  if(Object.keys(cart).length===0){ alert("Ton panier est vide"); return }
  document.getElementById("checkout-modal").classList.remove("modal-hidden")
  document.getElementById("form-order-summary").value = orderSummaryText()
}
function closeCheckout(){ document.getElementById("checkout-modal").classList.add("modal-hidden") }

function orderSummaryText(){
  return Object.values(cart).map(i=> `${i.qty}x ${i.title} (${formatPrice(i.price)})` ).join(" ; ") + " — TOTAL: " + formatPrice(cartTotal())
}

// ---------- Form submit (envoie vers Google Form) ----------
function submitOrderToGoogleForm(formData){
  if(!GOOGLE_FORM_ACTION_URL || GOOGLE_FORM_ACTION_URL.includes("TA_FORM_ID")){
    alert("Tu dois remplacer GOOGLE_FORM_ACTION_URL dans shop.js par l'URL action de ton Google Form (voir instructions). La commande a été préparée mais non envoyée.")
    return Promise.resolve({ok:false, reason:"no_form_url"})
  }
  return fetch(GOOGLE_FORM_ACTION_URL, {
    method:"POST",
    mode:"no-cors",
    body: formData
  }).then(()=> ({ok:true})).catch(err=>({ok:false, err}))
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", ()=>{
  loadCart(); renderProducts(); renderCart(); updateCartCount()

  document.getElementById("open-cart").addEventListener("click", ()=>{ openCart() })
  document.getElementById("close-cart").addEventListener("click", ()=>{ closeCart() })
  document.getElementById("checkout-btn").addEventListener("click", ()=>{ openCheckout() })
  document.getElementById("cancel-order").addEventListener("click", ()=>{ closeCheckout() })

  const form = document.getElementById("order-form")
  form.addEventListener("submit", async (e)=>{
    e.preventDefault()
    const fd = new FormData(form)
    fd.append("entry.TIMESTAMP", new Date().toISOString())
    const res = await submitOrderToGoogleForm(fd)
    if(res.ok){
      alert("Commande envoyée ! Tu verras la ligne dans Google Sheets.")
      cart = {}; saveCart(); renderCart(); updateCartCount(); closeCheckout()
    } else {
      alert("Problème lors de l'envoi. Vérifie la configuration du Formulaire (voir instructions).")
    }
  })
})
