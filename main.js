
let vcHistorial = []
let vcActual = null;

async function generarParDeClaves() {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );
    return keyPair; //{ publicKey, privateKey }
}



async function firmarVC(vc, privateKey) {
  const encoder = new TextEncoder();
  const datos = encoder.encode(JSON.stringify(vc));

  const firma = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    privateKey,
    datos  );

  return btoa(String.fromCharCode(...new Uint8Array(firma))); // base 64
}


async function verificarVC(vc, publicKey) {
  const firmaBase64 = vc.proof.jws;
  const firmaBytes = Uint8Array.from(atob(firmaBase64), c => c.charCodeAt(0));

  const vcSinProof = { ...vc };
  delete vcSinProof.proof;

  const encoder = new TextEncoder();
  const datos = encoder.encode(JSON.stringify(vcSinProof));

  const esValida = await crypto.subtle.verify(
    { name: "RSASSA-PKCS1-v1_5" },
    publicKey,
    firmaBytes,
    datos
  );

  return esValida;
}
let pairKeys;
window.onload = async function () {
  pairKeys = await generarParDeClaves();

};
async function crearVC() {
  const nombreEvento = document.getElementById("eventName").value;
  const fechaEvento = document.getElementById("eventDate").value;
  const horaEvento = document.getElementById("eventTime").value;
  const lugarEvento = document.getElementById("eventLocation").value;

  if (!nombreEvento || !fechaEvento  || !horaEvento || !lugarEvento) {
    alert("Por favor completa nombre y fecha del evento.");
    return;
  }

  vcActual = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", "EventAttendance"],
    issuer: "did:web:verievent.com",
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: "did:web:usuario123.com",
      name: "Luis Emilio",
      event: nombreEvento,
      time: horaEvento,
      date: fechaEvento,
      location: lugarEvento
    },
    proof: {
      type: "SimulatedSignature",
      created: new Date().toISOString(),
      proofPurpose: "assertionMethod",
      jws: {},
    },
  };

  firma = await firmarVC(vcActual,pairKeys.privateKey);
  vcActual.proof = {
    type: "RSASignature2025",
    created: new Date().toISOString(),
    proofPurpose: "assertionMethod",
    verificationMethod: "did:web:verievent.com#key-1",
    jws: firma
  };


  vcHistorial.push(vcActual);
  document.getElementById("vcDisplay").textContent = JSON.stringify(vcActual, null, 2);

  // Mostrar en historial
  const contenedor = document.getElementById("vcList");
  const vcDiv = document.createElement("div");
  vcDiv.className = "vc-box";

  // Título del evento
  vcDiv.innerHTML = `
    <strong>${nombreEvento} (${fechaEvento})</strong>
  `;

  // Mostrar JSON en <pre>
  const pre = document.createElement("pre");
  pre.textContent = JSON.stringify(vcActual, null, 2);
  vcDiv.appendChild(pre);

  // Botón descargar
  const btnDescargar = document.createElement("button");
  btnDescargar.textContent = "📥 Descargar";
  btnDescargar.onclick = () => {
    const blob = new Blob([JSON.stringify(vcActual, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "credencial.json";
    link.click();
  };
  vcDiv.appendChild(btnDescargar);

  // Botón eliminar (opcional)
  const btnEliminar = document.createElement("button");
  btnEliminar.textContent = "❌ Eliminar";
  btnEliminar.onclick = () => {
    vcDiv.remove(); // solo borra visualmente, no del array
  };
  vcDiv.appendChild(btnEliminar);

  contenedor.appendChild(vcDiv);
}



function descargarVC() {
  if (!vcActual) return alert("No hay credencial generada.");
  const blob = new Blob([JSON.stringify(vcActual, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "credencial.json";
  link.click();
}

function verificarVC() {
  const fileInput = document.getElementById("vcFileInput");
  const resultado = document.getElementById("verificacionResultado");

  if (!fileInput.files[0]) return alert("Selecciona un archivo .json");
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const vc = JSON.parse(e.target.result);
      if (
        vc.issuer === "did:web:verievent.com" &&
        vc.type.includes("VerifiableCredential") &&
        vc.proof?.jws
      ) {
        resultado.textContent = "✅ Credencial válida";
        resultado.style.color = "green";
      } else {
        throw new Error("Formato incorrecto");
      }
    } catch {
      resultado.textContent = "❌ Credencial inválida";
      resultado.style.color = "red";
    }
  };
  reader.readAsText(fileInput.files[0]);
}

