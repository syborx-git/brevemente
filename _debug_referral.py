from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.on("dialog", lambda d: d.accept())

    page.goto("http://localhost:5173/#/")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)

    # Sembrar una contra-referencia Silva -> Ortiz (pendiente)
    page.evaluate("""() => {
        localStorage.setItem('brevemente_counter_referrals', JSON.stringify([{
            id: 'ref-test-1',
            patientId: 'patient-1',
            patientName: 'Sofia Martinez',
            fromTherapistId: 'therapist-1',
            fromTherapistName: 'Dr. Alejandro Silva',
            toTherapistId: 'therapist-2',
            toTherapistName: 'Dra. Patricia Ortiz',
            reason: 'Prueba',
            status: 'solicitada',
            createdAt: new Date().toISOString()
        }]));
    }""")
    page.reload()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)

    # En rol terapeuta, usar selector "Ver como" -> Dra. Patricia Ortiz
    page.locator("button", has_text="Ver como:").click()
    page.wait_for_timeout(300)
    page.locator("button", has_text="Dra. Patricia Ortiz").click()
    page.wait_for_timeout(800)

    print("=== HEADER tras 'Ver como Dra. Patricia Ortiz' ===")
    print(page.locator("header").inner_text())

    # Abrir inbox
    page.locator("button", has_text="Contra-referencias").click()
    page.wait_for_timeout(600)

    overlay = page.locator("div").filter(has_text="Contra-referencias entrantes").first
    print("=== PANEL INBOX ===")
    print(overlay.inner_text())

    print("¿Muestra 'Sin solicitudes pendientes'?:", page.locator("text=Sin solicitudes pendientes.").count() > 0)
    print("¿Muestra a Sofia Martinez?:", page.locator("text=Sofia Martinez").count() > 0)

    browser.close()
