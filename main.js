
let vcActual = null;

function crearVC() {
  const nombreEvento = document.getElementById("eventName").value;
  const fechaEvento = document.getElementById("eventDate").value;
  if (!nombreEvento || !fechaEvento) {
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
      date: fechaEvento,
    },
    proof: {
      type: "SimulatedSignature",
      created: new Date().toISOString(),
      proofPurpose: "assertionMethod",
      jws: btoa(nombreEvento + fechaEvento),
    },
  };

  document.getElementById("vcDisplay").textContent = JSON.stringify(vcActual, null, 2);
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
