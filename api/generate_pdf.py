import io
import os
import json
import re
from http.server import BaseHTTPRequestHandler
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
try:
    from unidecode import unidecode
except ImportError:
    def unidecode(s): return s
# Register Gujarati Fonts
def register_gujarati_fonts():
    try:
        possible_paths = [
            os.path.join(os.getcwd(), "api", "NotoSansGujarati-Regular.ttf"),
            os.path.join(os.getcwd(), "NotoSansGujarati-Regular.ttf"),
            "api/NotoSansGujarati-Regular.ttf",
            "NotoSansGujarati-Regular.ttf"
        ]
        reg_path = ""
        for p in possible_paths:
            if os.path.exists(p):
                reg_path = p
                break
        if reg_path:
            bold_path = reg_path.replace("Regular", "Bold")
            pdfmetrics.registerFont(TTFont('Gujarati', reg_path))
            if os.path.exists(bold_path):
                pdfmetrics.registerFont(TTFont('Gujarati-Bold', bold_path))
            return True
    except: pass
    return False

HAS_GUJARATI = register_gujarati_fonts()

import qrcode
from PIL import Image

# BRAND COLORS
NAVY = colors.HexColor("#1B2B4B")
NAVY2 = colors.HexColor("#243352")
ORANGE = colors.HexColor("#F47920")
LIGHT_BG = colors.HexColor("#F4F7FB")
BORDER = colors.HexColor("#DDE4EF")
GREEN = colors.HexColor("#16A34A")
GREEN_BG = colors.HexColor("#DCFCE7")
RED_TEXT = colors.HexColor("#DC2626")
GREY = colors.HexColor("#64748B")
DARK = colors.HexColor("#1E293B")
LABEL = colors.HexColor("#94A3B8")
ORANGE_BG = colors.HexColor("#FFF7ED")
ORANGE_BD = colors.HexColor("#FED7AA")
WHITE = colors.HexColor("#FFFFFF")

def has_unicode(s):
    if not s: return False
    return any(ord(c) > 127 for c in str(s))

def draw_string(c, x, y, text, font=None, size=None, align="left"):
    """Smart string drawer that switches to Gujarati font if needed"""
    if not text: return
    text = str(text)
    f_name = font if font else getattr(c, '_fontname', 'Helvetica')
    f_size = size if size else getattr(c, '_fontsize', 9)
    current_font = f_name
    if HAS_GUJARATI and has_unicode(text):
        if "Bold" in f_name:
            current_font = "Gujarati-Bold"
        else:
            current_font = "Gujarati"
    c.setFont(current_font, f_size)
    if align == "center":
        c.drawCentredString(x, y, text)
    elif align == "right":
        c.drawRightString(x, y, text)
    else:
        c.drawString(x, y, text)
    c.setFont(f_name, f_size)

def safe_str(s):
    """Fallback if Gujarati font is NOT available"""
    if HAS_GUJARATI: return str(s) if s else ""
    if not s: return ""
    try:
        res = unidecode(str(s))
        return res if res.strip() else str(s)
    except: return str(s)

def rrect(c, x, y, w, h, r, fill=False, stroke=False, sw=0.5):
    """Stable rounded rect implementation using standard roundRect to avoid artifacts"""
    c.setLineWidth(sw)
    if fill:
        c.setFillColor(fill if isinstance(fill, colors.Color) else colors.white)
    if stroke:
        c.setStrokeColor(stroke if isinstance(stroke, colors.Color) else colors.black)
    
    # Using standard roundRect as manual path arcTo was creating diagonal artifacts in certain viewers
    c.roundRect(x, y, w, h, r, stroke=1 if stroke else 0, fill=1 if fill else 0)

def make_qr_image(text):
    """generates QR with qrcode lib as requested (fill=#1B2B4B, white back, ERROR_CORRECT_M)"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=0,
    )
    qr.add_data(text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1B2B4B", back_color="white")
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    return ImageReader(img_byte_arr)

def draw_logo(c, x, y, size):
    """loads logo from public dir and draws with size 14x14mm as requested"""
    # Robust path discovery for different environments (local vs Vercel)
    possible_roots = [os.getcwd(), os.path.dirname(os.path.abspath(__file__)), "/var/task", "/var/task/public"]
    possible_names = ["logo-mark.png", "sitaram_logo_512x512.png", "logo-transparent.png", "logo.png", "logo.jpg"]
    
    logo_img = None
    for root in possible_roots:
        for name in possible_names:
            # Try direct, then public/
            for p in [os.path.join(root, name), os.path.join(root, "public", name)]:
                if os.path.exists(p):
                    try:
                        logo_img = ImageReader(p)
                        break
                    except:
                        continue
            if logo_img: break
        if logo_img: break
    
    if logo_img:
        c.drawImage(logo_img, x, y, width=size, height=size, mask='auto')
    else:
        # High-fidelity fallback that looks like a real logo
        c.setFillColor(ORANGE)
        c.roundRect(x, y, size, size, 2*mm, stroke=0, fill=1)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold", 3.5)
        draw_string(c, x + size/2, y + size/2 + 0.5*mm, "SITARAM", align="center")
        c.setFont("Helvetica-Bold", 2)
        draw_string(c, x + size/2, y + size/2 - 1.5*mm, "CABLE & BROADBAND", align="center")

def hline(c, x1, x2, y, col, w):
    c.setStrokeColor(col)
    c.setLineWidth(w)
    c.line(x1, y, x2, y)

def clean_plan_name(plan_name, is_cable):
    """Strips speed indicators for Cable mode to keep documents professional"""
    if not plan_name:
        return "Service Plan"
    if is_cable:
        # Regex to remove patterns like 250mbps, 100 Mbps, 1gbps, etc.
        res = re.sub(r'\d+\s*(?:mbps|kbps|gbps)', '', plan_name, flags=re.IGNORECASE).strip()
        # Remove empty brackets or parentheses if left behind
        res = re.sub(r'\[\s*\]|\(\s*\)', '', res).strip()
        if not res or len(res) < 3 or res.lower() == "plan":
            res = "Digital Cable TV"
        return res
    return plan_name

def draw_shared_header(c, doc_type, brand, data):
    width, height = A4
    c.setFillColor(NAVY)
    c.rect(0, height - 48*mm, width, 48*mm, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.rect(0, height - 2.5*mm, width, 2.5*mm, fill=1, stroke=0)
    c.setFillColor(ORANGE)
    c.rect(0, height - 48*mm, width, 1.2*mm, fill=1, stroke=0)
    
    margin = 22*mm
    logo_size = 14*mm
    header_y = height - 48*mm
    logo_y = header_y + (48*mm - logo_size)/2
    draw_logo(c, margin, logo_y, logo_size)
    
    # Vertical Bar to match React UI
    c.setFillColor(ORANGE)
    c.setStrokeColor(ORANGE)
    c.setLineWidth(0.8*mm)
    c.line(margin + logo_size/2, logo_y - 2*mm, margin + logo_size/2, logo_y - 6*mm)
    
    text_x = margin + logo_size + 4*mm
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 6.5)
    draw_string(c, text_x, header_y + 28*mm, "OFFICIAL DOCUMENT")
    
    c.setFillColor(WHITE)
    brand_name = brand.get('name', 'SITARAM CABLE & BROADBAND').upper()
    # Dynamic font size to prevent overlap with right box
    title_fs = 18
    if len(brand_name) > 22: title_fs = 15
    if len(brand_name) > 28: title_fs = 13
    c.setFont("Helvetica-Bold", title_fs)
    draw_string(c, text_x, header_y + 20*mm, brand_name)
    
    c.setFillColor(LABEL)
    c.setFont("Helvetica", 7.5)
    # Filter out None or empty values for address/phone
    addr = brand.get('address', '').strip()
    phone = brand.get('phone', '').strip()
    header_info = f"{addr} | Support: {phone}" if addr and phone else (addr or f"Support: {phone}")
    draw_string(c, text_x, header_y + 14*mm, header_info)
    
    # Document Type Box (Right side of header)
    box_w = 55*mm
    box_h = 32*mm
    box_x = width - margin - box_w
    box_y = header_y + 8*mm
    rrect(c, box_x, box_y, box_w, box_h, 5*mm, fill=NAVY2, stroke=False)
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 7)
    draw_string(c, box_x + box_w/2, box_y + 24*mm, "DOCUMENT TYPE", align="center")
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 14)
    draw_string(c, box_x + box_w/2, box_y + 16*mm, doc_type.upper(), align="center")
    c.setFillColor(LABEL)
    c.setFont("Helvetica", 7.5)
    # Use bill date or current date
    doc_date = data.get('date', brand.get('currentDate', ''))
    draw_string(c, box_x + box_w/2, box_y + 8*mm, f"Date: {doc_date}", align="center")

def generate_invoice_pdf(buffer, data):
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin = 22*mm
    content_width = width - 2*margin
    brand = data.get('brand', {})
    is_cable = data.get('isCableMode', True)
    
    draw_shared_header(c, "Invoice", brand, data)
    
    # SECTION 1 — FOUR META CARDS
    y_pos = height - 48*mm - 20*mm
    card_w = (content_width - 9*mm) / 4
    card_h = 17*mm
    
    labels = ["INVOICE NO.", "INVOICE DATE", "BILLING PERIOD", "DUE DATE"]
    values = [
        data.get('number', 'N/A'),
        data.get('date', 'N/A'),
        data.get('billingPeriod', 'N/A'),
        data.get('dueDate', 'N/A')
    ]
    
    for i in range(4):
        x = margin + i * (card_w + 3*mm)
        if i == 2: # Highlighted card for Billing Period
            rrect(c, x, y_pos, card_w, card_h, 4*mm, fill=NAVY, stroke=False)
            c.setFont("Helvetica", 6.5)
            c.setFillColor(LABEL)
            draw_string(c, x + 3*mm, y_pos + 11*mm, labels[i])
            c.setFont("Helvetica-Bold", 9)
            c.setFillColor(WHITE)
            draw_string(c, x + 3*mm, y_pos + 4*mm, values[i])
        else:
            rrect(c, x, y_pos, card_w, card_h, 4*mm, fill=LIGHT_BG, stroke=BORDER)
            c.setFont("Helvetica", 6.5)
            c.setFillColor(LABEL)
            draw_string(c, x + 3*mm, y_pos + 11*mm, labels[i])
            c.setFont("Helvetica-Bold", 9)
            # Due date in red if not paid? Or just keep it clean
            c.setFillColor(RED_TEXT if (i == 3 and data.get('status') != 'paid') else DARK)
            draw_string(c, x + 3*mm, y_pos + 4*mm, values[i])

    # SECTION 2 — CUSTOMER + STATUS (60/40)
    y_pos -= 48*mm
    left_w = content_width * 0.6 - 1.5*mm
    right_w = content_width * 0.4 - 1.5*mm
    
    # Customer Info Box
    rrect(c, margin, y_pos, left_w, 45*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    
    # "Verified" Badge
    badge_w = 20*mm
    rrect(c, margin + left_w - badge_w - 5*mm, y_pos + 37*mm, badge_w, 4.5*mm, 2.2*mm, fill=NAVY, stroke=False)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 5.5)
    draw_string(c, margin + left_w - 5*mm - badge_w/2, y_pos + 38.5*mm, "VERIFIED ACCOUNT", align="center")

    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(ORANGE)
    draw_string(c, margin + 5*mm, y_pos + 38*mm, "BILLED TO CUSTOMER")
    
    # Fallback to customer code or ID if customerNo is missing
    cust_no = data.get('customerNo')
    if not cust_no or cust_no == '-':
        cust_no = data.get('customerId', '-')
    
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(GREY)
    draw_string(c, margin + 5*mm, y_pos + 31*mm, "#")
    c.setFillColor(NAVY)
    draw_string(c, margin + 8*mm, y_pos + 31*mm, str(cust_no))
    
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(DARK)
    # Move name down slightly to avoid overlap with verified badge
    draw_string(c, margin + 5*mm, y_pos + 28*mm, safe_str(data.get('customerName', 'VALUED CUSTOMER')))
    
    c.setFont("Helvetica", 9)
    c.setFillColor(DARK)
    addr_val = safe_str(data.get('customerAddress', ''))
    addr = str(addr_val).split('\n') if addr_val else []
    draw_string(c, margin + 5*mm, y_pos + 22*mm, addr[0] if len(addr) > 0 else 'No Address Provided')
    c.setFillColor(GREY)
    if len(addr) > 1:
        draw_string(c, margin + 5*mm, y_pos + 17*mm, addr[1])
    
    # Locality/Area
    area = data.get('customerArea', data.get('brand', {}).get('address', 'Bhavnagar, Gujarat'))
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(NAVY)
    draw_string(c, margin + 5*mm, y_pos + 12*mm, f"{safe_str(area).upper()}, GJ")
    
    # Dynamic Fields: STB/ID and Mobile - only show if valid
    stb_val = str(data.get('stbNumber') or '').strip()
    mobile_val = str(data.get('customerMobile') or '').strip()
    
    # Footer details within box (White strip at bottom)
    rrect(c, margin, y_pos, left_w, 12*mm, 0, fill=WHITE, stroke=False)
    hline(c, margin, margin + left_w, y_pos + 12*mm, BORDER, 0.4)
    
    row_y = y_pos + 4*mm
    has_stb = stb_val and stb_val.upper() not in ["N/A", "-", ""]
    if has_stb:
        label = "STB NO." if is_cable else "CUST ID"
        c.setFont("Helvetica-Bold", 6.5)
        c.setFillColor(LABEL)
        draw_string(c, margin + 5*mm, row_y + 3*mm, label)
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(DARK)
        draw_string(c, margin + 5*mm, row_y - 1*mm, stb_val)
        
    if mobile_val and mobile_val.upper() not in ["N/A", "-", ""]:
        x_off = left_w/2
        c.setFont("Helvetica-Bold", 6.5)
        c.setFillColor(LABEL)
        draw_string(c, margin + x_off, row_y + 3*mm, "PHONE NO.")
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(DARK)
        draw_string(c, margin + x_off, row_y - 1*mm, mobile_val)

    # Payment Status Box (Right)
    status = str(data.get('status', 'unpaid')).upper()
    badge_color = GREEN if status == 'PAID' else RED_TEXT
    badge_bg = GREEN_BG if status == 'PAID' else colors.HexColor("#FEE2E2")
    
    rrect(c, margin + left_w + 3*mm, y_pos, right_w, 45*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFont("Helvetica-Bold", 7)
    c.setFillColor(LABEL)
    draw_string(c, margin + left_w + 3*mm + right_w/2, y_pos + 38*mm, "PAYMENT STATUS", align="center")
    
    rrect(c, margin + left_w + 10*mm, y_pos + 20*mm, right_w - 14*mm, 12*mm, 4*mm, fill=badge_bg, stroke=False)
    c.setFont("Helvetica-Bold", 14)
    c.setFillColor(badge_color)
    draw_string(c, margin + left_w + 3*mm + right_w/2, y_pos + 24*mm, status, align="center")
    
    c.setFont("Helvetica", 7.5)
    c.setFillColor(LABEL)
    draw_string(c, margin + left_w + 3*mm + right_w/2, y_pos + 12*mm, f"DUE BY {data.get('dueDate', 'N/A')}", align="center")

    # SECTION 3 — SERVICE TABLE
    y_pos -= 15*mm
    c.setFillColor(NAVY)
    rrect(c, margin, y_pos, content_width, 9.5*mm, 4*mm, fill=NAVY, stroke=False)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 7.5)
    draw_string(c, margin + 5*mm, y_pos + 3.5*mm, "DESCRIPTION OF SERVICE")
    draw_string(c, margin + 75*mm, y_pos + 3.5*mm, "BILLING PERIOD", align="center")
    draw_string(c, margin + 120*mm, y_pos + 3.5*mm, "MONTHS", align="center")
    draw_string(c, width - margin - 5*mm, y_pos + 3.5*mm, "PLAN PRICE", align="right")
    
    y_pos -= 13*mm
    rrect(c, margin, y_pos, content_width, 12*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 10)
    # Clean plan name to remove speed indicators for Cable
    plan_name = clean_plan_name(data.get('planName', ''), is_cable)
    draw_string(c, margin + 5*mm, y_pos + 6.5*mm, plan_name)
    c.setFont("Helvetica", 7.5)
    c.setFillColor(GREY)
    service_desc = "Digital Cable TV Service" if is_cable else "High-Speed Internet Service"
    draw_string(c, margin + 5*mm, y_pos + 2.5*mm, service_desc)
    
    c.setFont("Helvetica", 9)
    c.setFillColor(DARK)
    draw_string(c, margin + 75*mm, y_pos + 5*mm, data.get('billingPeriod', 'N/A'), align="center")
    draw_string(c, margin + 120*mm, y_pos + 5*mm, str(data.get('planMonths', '1.0')), align="center")
    c.setFont("Helvetica-Bold", 10.5)
    c.setFillColor(NAVY)
    # Use "Rs." prefix as requested
    draw_string(c, width - margin - 5*mm, y_pos + 5*mm, f"Rs. {float(data.get('amount', 0)):.2f}", align="right")

    # SECTION 4 — QR + SUMMARY
    y_pos -= 50*mm
    # UPI QR Box
    rrect(c, margin, y_pos, 42*mm, 45*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 7)
    draw_string(c, margin + 21*mm, y_pos + 40*mm, "SCAN TO PAY (UPI)", align="center")
    rrect(c, margin + 6*mm, y_pos + 9*mm, 30*mm, 30*mm, 3*mm, fill=WHITE, stroke=False)
    
    upi_pa = brand.get('upiId', 'sitaram@upi')
    total_amt = float(data.get('amount', 0)) - float(data.get('discount', 0))
    upi_url = f"upi://pay?pa={upi_pa}&pn=Sitaram&am={total_amt}&cu=INR"
    qr_img = make_qr_image(upi_url)
    c.drawImage(qr_img, margin + 7*mm, y_pos + 10*mm, width=28*mm, height=28*mm)
    c.setFillColor(GREY)
    c.setFont("Helvetica", 6.5)
    draw_string(c, margin + 21*mm, y_pos + 4*mm, upi_pa, align="center")

    # Summary Box
    summary_x = margin + 45*mm
    summary_w = content_width - 45*mm
    rrect(c, summary_x, y_pos, summary_w, 45*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFillColor(LABEL)
    c.setFont("Helvetica-Bold", 7)
    draw_string(c, summary_x + 5*mm, y_pos + 40*mm, "INVOICE SUMMARY")
    hline(c, summary_x + 5*mm, summary_x + summary_w - 5*mm, y_pos + 38*mm, BORDER, 0.5)
    
    base_amt = float(data.get('amount', 0))
    disc_amt = float(data.get('discount', 0))
    row_y = y_pos + 32*mm
    c.setFont("Helvetica", 9)
    c.setFillColor(GREY)
    draw_string(c, summary_x + 5*mm, row_y, "Base Plan Amount")
    draw_string(c, summary_x + summary_w - 5*mm, row_y, f"Rs. {base_amt:.2f}", align="right")
    row_y -= 6*mm
    draw_string(c, summary_x + 5*mm, row_y, "Discount Applied")
    draw_string(c, summary_x + summary_w - 5*mm, row_y, f"Rs. {disc_amt:.2f}", align="right")
    row_y -= 6*mm
    draw_string(c, summary_x + 5*mm, row_y, "GST (Exempted)")
    draw_string(c, summary_x + summary_w - 5*mm, row_y, "Rs. 0.00", align="right")
    
    # Final Total Card
    total_y = y_pos + 3*mm
    rrect(c, summary_x + 3*mm, total_y, summary_w - 6*mm, 10*mm, 3*mm, fill=NAVY, stroke=False)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 10)
    draw_string(c, summary_x + 8*mm, total_y + 3.5*mm, "FINAL AMOUNT PAYABLE")
    c.setFont("Helvetica-Bold", 12.5)
    draw_string(c, summary_x + summary_w - 8*mm, total_y + 3.5*mm, f"Rs. {total_amt:.2f}", align="right")

    # Amount in Words Strip
    y_pos -= 15*mm
    rrect(c, margin, y_pos, content_width, 11*mm, 4*mm, fill=ORANGE_BG, stroke=ORANGE_BD)
    c.setFillColor(ORANGE)
    c.setFont("Helvetica-Bold", 7)
    draw_string(c, margin + 5*mm, y_pos + 6.5*mm, "AMOUNT IN WORDS")
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 9.5)
    words = data.get('amountInWords', 'Zero Rupees Only')
    if not words or words == 'N/A': words = "Zero Rupees Only"
    draw_string(c, margin + 35*mm, y_pos + 4*mm, safe_str(words))

    # Final Footer Section
    y_pos = 40*mm
    hline(c, margin, width - margin, y_pos, ORANGE, 1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 15)
    draw_string(c, width/2, y_pos - 8*mm, "Thank You!", align="center")
    c.setFillColor(GREY)
    c.setFont("Helvetica", 8.5)
    brand_title = brand.get('name', 'SITARAM CABLE & BROADBAND').upper()
    draw_string(c, width/2, y_pos - 13*mm, f"FOR CHOOSING {safe_str(brand_title)}", align="center")
    
    # Bottom Strip
    footer_h = 9*mm
    c.setFillColor(NAVY)
    c.rect(0, 0, width, footer_h, fill=1, stroke=0)
    hline(c, 0, width, footer_h, ORANGE, 1.2*mm)
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 7)
    draw_string(c, width/2, 3.5*mm, "THIS IS A COMPUTER GENERATED DOCUMENT • NO PHYSICAL SIGNATURE REQUIRED", align="center")
    c.save()

def generate_receipt_pdf(buffer, data):
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin = 22*mm
    content_width = width - 2*margin
    brand = data.get('brand', {})
    is_cable = data.get('isCableMode', True)
    
    draw_shared_header(c, "Receipt", brand, data)
    
    # SECTION 1 — FOUR META CARDS
    y_pos = height - 48*mm - 20*mm
    card_w = (content_width - 9*mm) / 4
    card_h = 17*mm
    
    labels = ["RECEIPT NO.", "PAYMENT DATE", "METHOD", "STATUS"]
    values = [
        data.get('number', 'N/A'),
        data.get('date', 'N/A'),
        str(data.get('method', 'CASH')).upper(),
        "SUCCESS"
    ]
    
    for i in range(4):
        x = margin + i * (card_w + 3*mm)
        if i == 2: # Method highlighted in Navy
            rrect(c, x, y_pos, card_w, card_h, 4*mm, fill=NAVY, stroke=False)
            c.setFont("Helvetica", 6.5)
            c.setFillColor(LABEL)
            draw_string(c, x + 3*mm, y_pos + 11*mm, labels[i])
            c.setFont("Helvetica-Bold", 9)
            c.setFillColor(WHITE)
            draw_string(c, x + 3*mm, y_pos + 4*mm, values[i])
        elif i == 3: # Status highlighted in Green
            rrect(c, x, y_pos, card_w, card_h, 4*mm, fill=GREEN_BG, stroke=GREEN, sw=0.5)
            c.setFont("Helvetica", 6.5)
            c.setFillColor(LABEL)
            draw_string(c, x + 3*mm, y_pos + 11*mm, labels[i])
            c.setFont("Helvetica-Bold", 9)
            c.setFillColor(GREEN)
            draw_string(c, x + 3*mm, y_pos + 4*mm, values[i])
        else:
            rrect(c, x, y_pos, card_w, card_h, 4*mm, fill=LIGHT_BG, stroke=BORDER)
            c.setFont("Helvetica", 6.5)
            c.setFillColor(LABEL)
            draw_string(c, x + 3*mm, y_pos + 11*mm, labels[i])
            c.setFont("Helvetica-Bold", 9)
            c.setFillColor(DARK)
            draw_string(c, x + 3*mm, y_pos + 4*mm, values[i])

    # SECTION 2 — CUSTOMER + TOTAL RECEIVED (60/40)
    y_pos -= 48*mm
    left_w = content_width * 0.6 - 1.5*mm
    right_w = content_width * 0.4 - 1.5*mm
    
    # Customer Information
    rrect(c, margin, y_pos, left_w, 46*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFont("Helvetica-Bold", 7)
    c.setFillColor(ORANGE)
    draw_string(c, margin + 5*mm, y_pos + 39*mm, "RECEIVED FROM CUSTOMER")
    
    cust_no = data.get('customerNo', '-')
    c.setFont("Helvetica-Bold", 10)
    c.setFillColor(DARK)
    draw_string(c, margin + 5*mm, y_pos + 32*mm, f"#{cust_no}")
    c.setFont("Helvetica-Bold", 13)
    draw_string(c, margin + 22*mm, y_pos + 32*mm, safe_str(data.get('customerName', 'N/A')))
    
    c.setFont("Helvetica", 8.5)
    c.setFillColor(GREY)
    addr_val = safe_str(data.get('customerAddress', 'N/A'))
    addr = str(addr_val).split('\n') if addr_val else ['N/A']
    draw_string(c, margin + 5*mm, y_pos + 26*mm, addr[0] if len(addr) > 0 else 'N/A')
    draw_string(c, margin + 5*mm, y_pos + 21*mm, addr[1] if len(addr) > 1 else '')
    
    # Dynamic Fields: STB/ID and Mobile
    stb_val = str(data.get('stbNumber') or '').strip()
    mobile_val = str(data.get('customerMobile') or '').strip()
    
    row_y = y_pos + 10*mm
    has_stb = stb_val and stb_val.upper() not in ["N/A", "-", ""]
    if has_stb:
        label = "STB:" if is_cable else "ID:"
        c.setFont("Helvetica", 7.5)
        c.setFillColor(LABEL)
        draw_string(c, margin + 5*mm, row_y, label)
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(DARK)
        draw_string(c, margin + 12*mm, row_y, stb_val)
        
    if mobile_val and mobile_val.upper() not in ["N/A", "-", ""]:
        x_off = 45*mm if has_stb else 5*mm
        c.setFont("Helvetica", 7.5)
        c.setFillColor(LABEL)
        draw_string(c, margin + x_off, row_y, "MOBILE:")
        c.setFont("Helvetica-Bold", 8.5)
        c.setFillColor(DARK)
        draw_string(c, margin + x_off + 14*mm, row_y, mobile_val)

    # Amount Card (Large Navy Card)
    rrect(c, margin + left_w + 3*mm, y_pos, right_w, 46*mm, 4*mm, fill=NAVY, stroke=False)
    c.setFont("Helvetica-Bold", 7.5)
    c.setFillColor(LABEL)
    draw_string(c, margin + left_w + 3*mm + right_w/2, y_pos + 39*mm, "TOTAL PAID", align="center")
    hline(c, margin + left_w + 10*mm, margin + content_width - 7*mm, y_pos + 37*mm, WHITE, 0.4)
    
    c.setFont("Helvetica-Bold", 34)
    c.setFillColor(WHITE)
    amount = float(data.get('amount', 0))
    # Using Rs. prefix in small text above if needed, but here just big amount
    draw_string(c, margin + left_w + 3*mm + right_w/2, y_pos + 18*mm, f"{int(amount)}", align="center")
    c.setFont("Helvetica", 8)
    c.setFillColor(LABEL)
    draw_string(c, margin + left_w + 3*mm + right_w/2, y_pos + 8*mm, "RUPEES ONLY • NET RECEIVED", align="center")

    # SECTION 3 — SERVICE TABLE
    y_pos -= 15*mm
    c.setFillColor(NAVY)
    rrect(c, margin, y_pos, content_width, 9.5*mm, 4*mm, fill=NAVY, stroke=False)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 7.5)
    draw_string(c, margin + 5*mm, y_pos + 3.5*mm, "SERVICE DESCRIPTION")
    draw_string(c, margin + 75*mm, y_pos + 3.5*mm, "SERVICE PERIOD", align="center")
    draw_string(c, margin + 120*mm, y_pos + 3.5*mm, "QTY", align="center")
    draw_string(c, width - margin - 5*mm, y_pos + 3.5*mm, "AMOUNT", align="right")
    
    items = data.get('items', [])
    if not items:
        # Construct single item from top-level data
        items = [{
            'desc': clean_plan_name(data.get('planName', 'Service Plan'), is_cable),
            'period': data.get('billingPeriod', 'N/A'),
            'qty': 1,
            'total': data.get('amount', 0),
            'subDesc': "Digital Cable TV Service" if is_cable else "High-Speed Internet Service"
        }]
        
    for item in items:
        y_pos -= 13*mm
        rrect(c, margin, y_pos, content_width, 12*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
        c.setFillColor(DARK)
        c.setFont("Helvetica-Bold", 10)
        draw_string(c, margin + 5*mm, y_pos + 6.5*mm, item.get('desc', 'N/A'))
        c.setFont("Helvetica", 7.5)
        c.setFillColor(GREY)
        draw_string(c, margin + 5*mm, y_pos + 2.5*mm, item.get('subDesc', ''))
        
        c.setFont("Helvetica", 9)
        c.setFillColor(DARK)
        draw_string(c, margin + 75*mm, y_pos + 5*mm, item.get('period', 'N/A'), align="center")
        draw_string(c, margin + 120*mm, y_pos + 5*mm, str(item.get('qty', '1')), align="center")
        c.setFont("Helvetica-Bold", 10.5)
        c.setFillColor(NAVY)
        draw_string(c, width - margin - 5*mm, y_pos + 5*mm, f"Rs. {float(item.get('total', 0)):.2f}", align="right")

    # SECTION 4 — BREAKDOWN
    y_pos -= 45*mm
    break_w = content_width * 0.45
    break_x = width - margin - break_w
    rrect(c, break_x, y_pos, break_w, 35*mm, 4*mm, fill=LIGHT_BG, stroke=BORDER)
    c.setFillColor(LABEL)
    c.setFont("Helvetica-Bold", 7)
    draw_string(c, break_x + 5*mm, y_pos + 30*mm, "PAYMENT BREAKDOWN")
    hline(c, break_x + 5*mm, break_x + break_w - 5*mm, y_pos + 28*mm, BORDER, 0.5)
    
    row_y = y_pos + 22*mm
    c.setFont("Helvetica-Bold", 9.5)
    c.setFillColor(DARK)
    draw_string(c, break_x + 5*mm, row_y, "Gross Amount")
    draw_string(c, break_x + break_w - 5*mm, row_y, f"Rs. {amount:.2f}", align="right")
    row_y -= 6*mm
    c.setFont("Helvetica", 8.5)
    c.setFillColor(GREY)
    draw_string(c, break_x + 5*mm, row_y, "Taxes & Adjustments")
    draw_string(c, break_x + break_w - 5*mm, row_y, "Rs. 0.00", align="right")
    hline(c, break_x + 5*mm, break_x + break_w - 5*mm, row_y - 4*mm, BORDER, 0.4)
    
    # Net Total Card
    rrect(c, break_x + 3*mm, y_pos + 3*mm, break_w - 6*mm, 10*mm, 3*mm, fill=NAVY, stroke=False)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold", 9.5)
    draw_string(c, break_x + 8*mm, y_pos + 6.5*mm, "NET RECEIVED")
    c.setFont("Helvetica-Bold", 12.5)
    draw_string(c, break_x + break_w - 8*mm, y_pos + 6.5*mm, f"Rs. {amount:.2f}", align="right")

    # Receipt Footer Section
    y_pos = 40*mm
    hline(c, margin, width - margin, y_pos, ORANGE, 1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 15)
    draw_string(c, width/2, y_pos - 8*mm, "Payment Confirmed", align="center")
    c.setFillColor(GREY)
    c.setFont("Helvetica", 8.5)
    draw_string(c, width/2, y_pos - 13*mm, "OFFICIAL DIGITAL PAYMENT RECEIPT", align="center")
    hline(c, margin, width - margin, y_pos - 18*mm, ORANGE, 1)
    
    # Bottom strip
    footer_h = 9*mm
    c.setFillColor(NAVY)
    c.rect(0, 0, width, footer_h, fill=1, stroke=0)
    hline(c, 0, width, footer_h, ORANGE, 1.2*mm)
    c.setFillColor(WHITE)
    c.setFont("Helvetica", 7)
    draw_string(c, width/2, 3.5*mm, "THIS IS A COMPUTER GENERATED RECEIPT • VALID WITHOUT PHYSICAL SIGNATURE", align="center")
    c.save()

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            doc_type = data.get('type', 'invoice')
            buffer = io.BytesIO()
            
            if doc_type == 'invoice':
                generate_invoice_pdf(buffer, data)
                filename = f"Invoice_{data.get('number', 'INV')}.pdf"
            else:
                generate_receipt_pdf(buffer, data)
                filename = f"Receipt_{data.get('number', 'PAY')}.pdf"
                
            pdf_data = buffer.getvalue()
            buffer.close()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/pdf')
            self.send_header('Content-Disposition', f'attachment; filename="{filename}"')
            self.send_header('Content-Length', len(pdf_data))
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(pdf_data)
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
