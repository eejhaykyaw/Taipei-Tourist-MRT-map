
const statusBar=document.getElementById("statusBar");

const map=L.map("map").setView([25.05,121.55],11);

// basemaps
const basemaps={
carto_light:L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"),
carto_voyager:L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"),
esri:L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"),
osm:L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
};
let activeBase=basemaps.carto_light.addTo(map);

// clustering
const cluster=L.markerClusterGroup({maxClusterRadius:50});
map.addLayer(cluster);

// state
let activeCats=new Set();
let searchTerm="";

// categories
const categories=[...new Set(TPE_SPOTS.map(s=>s.category))].sort();
const filtersEl=document.getElementById("filters");

function renderFilters(){
filtersEl.innerHTML="";
categories.forEach(cat=>{
const el=document.createElement("div");
el.className="pill "+(activeCats.has(cat)?"on":"");
el.textContent=cat;
el.onclick=()=>{
activeCats.has(cat)?activeCats.delete(cat):activeCats.add(cat);
renderFilters(); renderMarkers(); renderList();
};
filtersEl.appendChild(el);
});
}
renderFilters();

// suggestions
const sug=document.getElementById("suggestions");
[...TPE_SPOTS.map(x=>x.name),...categories].forEach(n=>{
let o=document.createElement("option");o.value=n;sug.appendChild(o);
});

// markers
let markerIndex=[];
function renderMarkers(){
cluster.clearLayers(); markerIndex=[];
TPE_SPOTS.forEach(sp=>{
if(activeCats.size && !activeCats.has(sp.category)) return;
if(searchTerm && !(sp.name+sp.category).toLowerCase().includes(searchTerm)) return;

let m=L.marker([sp.lat,sp.lng]).bindPopup("<b>"+sp.name+"</b><br>"+sp.category);
cluster.addLayer(m);
markerIndex.push({sp,m});
});
statusBar.textContent=markerIndex.length+" places shown";
}
renderMarkers();

// list
const listEl=document.getElementById("list");
function renderList(){
listEl.innerHTML="";
markerIndex.forEach(x=>{
let d=document.createElement("div");
d.className="item";
d.innerHTML=`<div class="name">${x.sp.name}</div>
<div class="meta">${x.sp.category}</div>
<a class="btn" href="#">Zoom</a>`;
d.querySelector("a").onclick=e=>{
e.preventDefault();
map.setView([x.sp.lat,x.sp.lng],15);
x.m.openPopup();
};
listEl.appendChild(d);
});
}
renderList();

// search
document.getElementById("search").oninput=e=>{
searchTerm=e.target.value.toLowerCase();
renderMarkers(); renderList();
};

// basemap switch
document.getElementById("basemap").onchange=e=>{
map.removeLayer(activeBase);
activeBase=basemaps[e.target.value].addTo(map);
};

// reset
document.getElementById("resetBtn").onclick=()=>{
searchTerm=""; activeCats.clear();
document.getElementById("search").value="";
renderFilters(); renderMarkers(); renderList();
map.setView([25.05,121.55],11);
};

// location
let myMarker=null,myCircle=null;
document.getElementById("locBtn").onclick=()=>{
if(!navigator.geolocation){alert("Geolocation not supported");return;}
statusBar.textContent="Getting location...";
navigator.geolocation.getCurrentPosition(pos=>{
let {latitude,longitude,accuracy}=pos.coords;
if(myMarker) map.removeLayer(myMarker);
if(myCircle) map.removeLayer(myCircle);
myMarker=L.marker([latitude,longitude]).addTo(map).bindPopup("You are here").openPopup();
myCircle=L.circle([latitude,longitude],{radius:accuracy,opacity:.6,fillOpacity:.1}).addTo(map);
map.setView([latitude,longitude],15);
statusBar.textContent="Location found";
},()=>{statusBar.textContent="Location denied";});
};

// panel toggle
document.getElementById("closePanel").onclick=()=>document.getElementById("sidepanel").style.display="none";
