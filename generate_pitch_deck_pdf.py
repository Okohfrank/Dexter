"""
Dexter Pitch Deck PDF Generator - Naira (₦) Strategic Edition
Generates a 10-page landscape investor-grade pitch deck document calibrated in Nigerian Naira (₦).
"""

import os
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

def create_naira_pitch_deck():
    output_path = r"c:\Users\Owner\OneDrive\Desktop\Dexter\Dexter_Pitch_Deck_10_Pages.pdf"
    
    doc = SimpleDocTemplate(
        output_path,
        pagesize=landscape(letter),
        leftMargin=0.45 * inch,
        rightMargin=0.45 * inch,
        topMargin=0.42 * inch,
        bottomMargin=0.42 * inch
    )
    
    # Palette
    c_bg = colors.HexColor("#0B0F19")
    c_card = colors.HexColor("#141C2E")
    c_card_border = colors.HexColor("#24334C")
    c_emerald = colors.HexColor("#10B981")
    c_indigo = colors.HexColor("#6366F1")
    c_violet = colors.HexColor("#8B5CF6")
    c_text_light = colors.HexColor("#F9FAFB")
    c_text_muted = colors.HexColor("#9CA3AF")
    c_amber = colors.HexColor("#F59E0B")
    
    styles = getSampleStyleSheet()
    
    cover_title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=34,
        leading=38,
        textColor=c_text_light,
        alignment=TA_LEFT
    )
    
    cover_sub_style = ParagraphStyle(
        'CoverSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13.5,
        leading=18,
        textColor=c_emerald,
        alignment=TA_LEFT
    )
    
    slide_cat_style = ParagraphStyle(
        'SlideCategory',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=c_emerald,
        alignment=TA_LEFT
    )
    
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16.5,
        leading=20,
        textColor=c_text_light,
        alignment=TA_LEFT
    )
    
    card_title_style = ParagraphStyle(
        'CardTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        textColor=c_emerald,
        alignment=TA_LEFT
    )
    
    card_title_indigo = ParagraphStyle(
        'CardTitleIndigo',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        textColor=c_indigo,
        alignment=TA_LEFT
    )

    card_title_amber = ParagraphStyle(
        'CardTitleAmber',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        textColor=c_amber,
        alignment=TA_LEFT
    )
    
    body_style = ParagraphStyle(
        'BodyTextDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.8,
        leading=12.2,
        textColor=c_text_muted,
        alignment=TA_LEFT
    )
    
    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.8,
        leading=12.2,
        textColor=c_text_light,
        alignment=TA_LEFT
    )

    stat_num_style = ParagraphStyle(
        'StatNumber',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=19,
        leading=22,
        textColor=c_emerald,
        alignment=TA_CENTER
    )

    speaker_note_style = ParagraphStyle(
        'SpeakerNote',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#CBD5E1"),
        alignment=TA_LEFT
    )

    story = []

    def make_card(title_p, content_paragraphs, border_color=c_card_border, bg_color=c_card, width=3.25*inch):
        flowables = [title_p, Spacer(1, 3)]
        for p in content_paragraphs:
            flowables.append(p)
            flowables.append(Spacer(1, 2))
        
        t = Table([[flowables]], colWidths=[width])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_color),
            ('BOX', (0,0), (-1,-1), 1, border_color),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        return t

    def make_speaker_box(text, width=10.1*inch):
        p_title = Paragraph("<b>FOUNDER PITCH SCRIPT & STRATEGIC INTENT:</b>", ParagraphStyle('PST', fontName='Helvetica-Bold', fontSize=7.5, leading=9, textColor=c_indigo))
        p_text = Paragraph(f'"{text}"', speaker_note_style)
        t = Table([[ [p_title, Spacer(1, 2), p_text] ]], colWidths=[width])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#0D1322")),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#1E293B")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 7),
            ('RIGHTPADDING', (0,0), (-1,-1), 7),
        ]))
        return t

    # -------------------------------------------------------------
    # SLIDE 1: TITLE & CATEGORY CREATION
    # -------------------------------------------------------------
    story.append(Paragraph("SLIDE 01 // CATEGORY CREATION & STRATEGIC VISION", slide_cat_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph("DEXTER : THE AI SOCIAL MEDIA EMPLOYEE", cover_title_style))
    story.append(Paragraph("The World's First Memory-Centric, Autonomous AI Social Media Employee", cover_sub_style))
    story.append(Spacer(1, 8))

    c1 = make_card(
        Paragraph("🎯 The B2B Wedge Strategy", card_title_style),
        [
            Paragraph("<b>Target:</b> Nigerian & Global Tech Founders, Executives, and High-Growth SMEs.", body_bold),
            Paragraph("Replaces <b>&#8358;300,000–&#8358;800,000/mo</b> agency retainers with a dedicated AI teammate for just <b>&#8358;75,000/mo</b>.", body_style),
            Paragraph("<b>Zero Friction:</b> 5-minute interactive voice interview creates complete brand strategy.", body_style)
        ],
        width=3.25*inch
    )
    c2 = make_card(
        Paragraph("🧠 Proprietary MemoryEngine", card_title_indigo),
        [
            Paragraph("<b>Compounding Brand Intelligence:</b> Stores tone, past wins, target audiences, and industry viewpoints.", body_bold),
            Paragraph("Never forgets context—gets sharper, faster, and more aligned with every published post.", body_style)
        ],
        width=3.25*inch
    )
    c3 = make_card(
        Paragraph("🚀 Native Closed-Loop Publishing", card_title_style),
        [
            Paragraph("<b>Full-Cycle Autonomy:</b> Voice ingestion ➡️ Strategic Synthesis ➡️ Graphic Creation ➡️ Direct LinkedIn/X Publishing.", body_bold),
            Paragraph("Provides 100% autonomous execution with complete mobile/web review control.", body_style)
        ],
        width=3.25*inch
    )
    
    t_row = Table([[c1, c2, c3]], colWidths=[3.35*inch, 3.35*inch, 3.35*inch])
    t_row.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(t_row)
    story.append(Spacer(1, 8))

    b_table = Table([[
        Paragraph("<b>90% Cost Reduction</b><br/><font size=6.5 color='#9CA3AF'>&#8358;75k/mo vs &#8358;500k agency</font>", ParagraphStyle('b1', alignment=TA_CENTER, textColor=c_text_light, fontSize=8, leading=11)),
        Paragraph("<b>10x Consistency</b><br/><font size=6.5 color='#9CA3AF'>Daily posts on autopilot</font>", ParagraphStyle('b2', alignment=TA_CENTER, textColor=c_text_light, fontSize=8, leading=11)),
        Paragraph("<b>85%+ Gross Margins</b><br/><font size=6.5 color='#9CA3AF'>Cached context inference</font>", ParagraphStyle('b3', alignment=TA_CENTER, textColor=c_text_light, fontSize=8, leading=11)),
        Paragraph("<b>Live API Compliant</b><br/><font size=6.5 color='#9CA3AF'>Official OAuth 2.0 verified</font>", ParagraphStyle('b4', alignment=TA_CENTER, textColor=c_text_light, fontSize=8, leading=11)),
    ]], colWidths=[2.52*inch, 2.52*inch, 2.52*inch, 2.52*inch])
    b_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#111827")),
        ('BOX', (0,0), (-1,-1), 1, c_card_border),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(b_table)
    story.append(Spacer(1, 6))
    story.append(make_speaker_box("Every business knows they need an active executive brand on LinkedIn and Twitter to close deals, hire top talent, and build credibility. But hiring an agency in Lagos or internationally costs upwards of 500,000 Naira every month, while doing it yourself takes 15 hours a week. Dexter is an autonomous digital employee that captures your voice in 5 minutes and runs your growth for a fraction of the cost."))
    story.append(PageBreak())

    # -------------------------------------------------------------
    # SLIDE 2: THE PROBLEM
    # -------------------------------------------------------------
    story.append(Paragraph("SLIDE 02 // MARKET FRICTION & INEFFICIENCY", slide_cat_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph("The Structural Breakdown of Modern B2B Marketing", heading_style))
    story.append(Paragraph("Founders and business leaders face an unsustainable choice: expensive agencies, costly in-house hires, or tedious DIY.", body_style))
    story.append(Spacer(1, 6))

    p1 = make_card(
        Paragraph("💸 Expensive Agency / SMM Retainers", card_title_amber),
        [
            Paragraph("• Marketing agencies charge <b>&#8358;300,000 to &#8358;1,000,000+/month</b> with slow 2-week turnaround cycles.", body_style),
            Paragraph("• In-house Social Media Managers (SMMs) cost &#8358;250k–&#8358;500k/mo + laptops + data, and still struggle with technical executive voice.", body_style),
            Paragraph("• Junior writers lack domain authority and produce generic, repetitive fluff.", body_style)
        ],
        border_color=colors.HexColor("#78350F"),
        width=3.25*inch
    )
    p2 = make_card(
        Paragraph("⏱️ Extreme Founder Time Drain", card_title_amber),
        [
            Paragraph("• Founders and executives waste <b>15 to 20 hours every week</b> manually writing, editing, and designing graphics.", body_style),
            Paragraph("• Creative fatigue leads to erratic posting: 3 weeks of silence followed by 2 days of rushed posts.", body_style),
            Paragraph("• Inconsistent activity destroys algorithmic reach and leads to missed pipeline opportunities.", body_style)
        ],
        border_color=colors.HexColor("#78350F"),
        width=3.25*inch
    )
    p3 = make_card(
        Paragraph("🧩 Stateless AI & Tool Fragmentation", card_title_amber),
        [
            Paragraph("• Juggling 5 disconnected tools: ChatGPT + Canva + Buffer + Notion + Google Docs.", body_style),
            Paragraph("• <b>Generic Output:</b> ChatGPT has zero memory—users must paste lengthy prompts every single time.", body_style),
            Paragraph("• Zero feedback loop: Schedulers don't learn from post analytics to improve future content.", body_style)
        ],
        border_color=colors.HexColor("#78350F"),
        width=3.25*inch
    )
    t_row2 = Table([[p1, p2, p3]], colWidths=[3.35*inch, 3.35*inch, 3.35*inch])
    t_row2.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(t_row2)
    story.append(Spacer(1, 8))

    takeaway_p = Paragraph(
        "<b>THE ROOT PROBLEM:</b> Businesses are forced to spend <b>&#8358;4M–&#8358;10M annually</b> on human retainers or suffer through stateless software tools that require constant babysitting. There is no automated system that remembers brand context and executes end-to-end.",
        ParagraphStyle('TC', fontName='Helvetica', fontSize=8.5, leading=12, textColor=c_text_light)
    )
    t_takeaway = Table([[takeaway_p]], colWidths=[10.1*inch])
    t_takeaway.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#1E1B4B")),
        ('BOX', (0,0), (-1,-1), 1, c_indigo),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_takeaway)
    story.append(Spacer(1, 6))
    story.append(make_speaker_box("Companies are spending millions of Naira every year on junior agency writers or wasting 20 hours a week in fragmented tools. The core flaw is that existing AI tools are stateless—they forget who you are every time. Dexter eliminates this with persistent brand memory."))
    story.append(PageBreak())

    # -------------------------------------------------------------
    # SLIDE 3: THE SOLUTION
    # -------------------------------------------------------------
    story.append(Paragraph("SLIDE 03 // THE DEXTER SOLUTION & FLYWHEEL", slide_cat_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph("The Autonomous Brand Engine: Voice, Memory, Execution", heading_style))
    story.append(Paragraph("A closed-loop system where 5 minutes of conversational voice input produces compounding, continuous growth.", body_style))
    story.append(Spacer(1, 6))

    s1 = make_card(
        Paragraph("1. Conversational Voice Ingestion", card_title_style),
        [
            Paragraph("• A 5-minute dynamic AI voice onboarding captures natural cadence, philosophy, and strategic goals.", body_style),
            Paragraph("• Extracts core thematic pillars, audience personas, and distinct tonal nuances seamlessly.", body_style)
        ],
        width=2.4*inch
    )
    s2 = make_card(
        Paragraph("2. Strategic MemoryEngine", card_title_indigo),
        [
            Paragraph("• Builds an evolving <b>Brand Knowledge Graph</b> storing guidelines, past wins, and key talking points.", body_style),
            Paragraph("• Never forgets context, eliminating repetitive prompting and ensuring flawless brand alignment.", body_style)
        ],
        width=2.4*inch
    )
    s3 = make_card(
        Paragraph("3. Multimodal Copilot", card_title_style),
        [
            Paragraph("• Generates punchy hooks, high-converting carousels, and customized brand graphic assets.", body_style),
            Paragraph("• Interactive real-time voice & text copilot lets you edit, remix, and brainstorm on command.", body_style)
        ],
        width=2.4*inch
    )
    s4 = make_card(
        Paragraph("4. Native API Publishing & Loop", card_title_indigo),
        [
            Paragraph("• Direct publishing via official OAuth 2.0 APIs (LinkedIn, X) with randomized scheduling buffers.", body_style),
            Paragraph("• Learns from post engagement data to automatically optimize future content pillars.", body_style)
        ],
        width=2.4*inch
    )

    t_row3 = Table([[s1, s2, s3, s4]], colWidths=[2.52*inch, 2.52*inch, 2.52*inch, 2.52*inch])
    t_row3.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(t_row3)
    story.append(Spacer(1, 8))

    c_comp = Table([
        [
            Paragraph("<b>TRADITIONAL LABOUR MODEL (&#8358;500k/mo + 16 hrs/wk)</b>", ParagraphStyle('CW1', fontName='Helvetica-Bold', fontSize=8, textColor=c_amber)),
            Paragraph("<b>DEXTER AUTONOMOUS MODEL (&#8358;75k/mo + 5 mins/wk)</b>", ParagraphStyle('CW2', fontName='Helvetica-Bold', fontSize=8, textColor=c_emerald))
        ],
        [
            Paragraph("Hire agency or SMM ➡️ Write brief ➡️ 2-week wait ➡️ Review bad copy ➡️ Request revisions ➡️ Export graphics ➡️ Manually post.", body_style),
            Paragraph("5-minute voice interview once ➡️ Dexter generates strategy, copy & graphics ➡️ 1-Tap Mobile Review / Copilot Polish ➡️ Direct Auto-Publish.", body_style)
        ]
    ], colWidths=[5.0*inch, 5.0*inch])
    c_comp.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor("#18141F")),
        ('BACKGROUND', (1,0), (1,-1), colors.HexColor("#06241C")),
        ('BOX', (0,0), (0,-1), 1, colors.HexColor("#4B2618")),
        ('BOX', (1,0), (1,-1), 1, colors.HexColor("#0D563C")),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(c_comp)
    story.append(Spacer(1, 6))
    story.append(make_speaker_box("Dexter transforms social media from a stressful daily chore into an autonomous background engine. In five minutes of voice onboarding, Dexter synthesizes your strategic pillars, produces publication-ready content with graphics, and pushes it directly to your live feeds with full analytics feedback."))
    story.append(PageBreak())

    # -------------------------------------------------------------
    # SLIDE 4: PRODUCT & ARCHITECTURE
    # -------------------------------------------------------------
    story.append(Paragraph("SLIDE 04 // PRODUCT ENGINE & TECHNICAL MOAT", slide_cat_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph("Enterprise-Grade Architecture Built for Speed and Privacy", heading_style))
    story.append(Paragraph("Dual-tier memory retrieval, asynchronous job distribution, and bank-grade OAuth credential encryption.", body_style))
    story.append(Spacer(1, 6))

    a1 = make_card(
        Paragraph("1. Streaming Ingestion Pipeline", card_title_style),
        [
            Paragraph("• <b>Multi-Modal Ingestion:</b> Voice audio streams, external blogs, PDFs, and slide decks.", body_style),
            Paragraph("• <b>Whisper & Acoustic Tone Extraction:</b> Extracts pace, emotional register, and phrasing markers.", body_style)
        ],
        width=3.25*inch
    )
    a2 = make_card(
        Paragraph("2. Hierarchical MemoryEngine", card_title_indigo),
        [
            Paragraph("• <b>Semantic Context Cache:</b> Fast-access memory store ensuring 0ms prompt reconstruction.", body_style),
            Paragraph("• <b>Performance Weight Matrix:</b> Dynamically weights high-performing hooks and topic angles.", body_style)
        ],
        width=3.25*inch
    )
    a3 = make_card(
        Paragraph("3. Asynchronous Worker Cluster", card_title_style),
        [
            Paragraph("• <b>ARQ + Redis Queuing:</b> Decoupled background task execution resilient to rate limits.", body_style),
            Paragraph("• <b>AES-256 Token Encryption:</b> Hardened tenant isolation and official OAuth 2.0 PKCE compliance.", body_style)
        ],
        width=3.25*inch
    )

    t_arch = Table([[a1, a2, a3]], colWidths=[3.35*inch, 3.35*inch, 3.35*inch])
    t_arch.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(t_arch)
    story.append(Spacer(1, 8))

    tech_table = Table([
        [
            Paragraph("<b>SYSTEM SUBSYSTEM</b>", ParagraphStyle('TH1', fontName='Helvetica-Bold', fontSize=7.5, textColor=c_emerald)),
            Paragraph("<b>CORE TECHNOLOGY</b>", ParagraphStyle('TH2', fontName='Helvetica-Bold', fontSize=7.5, textColor=c_emerald)),
            Paragraph("<b>DEFENSIVE STRATEGIC MOAT</b>", ParagraphStyle('TH3', fontName='Helvetica-Bold', fontSize=7.5, textColor=c_emerald))
        ],
        [
            Paragraph("<b>Client Architecture</b>", body_bold),
            Paragraph("React Native (Expo SDK 54), TypeScript, Native Audio APIs", body_style),
            Paragraph("Single codebase across Mobile & Web with real-time audio copilot capabilities.", body_style)
        ],
        [
            Paragraph("<b>API & Inference Engine</b>", body_bold),
            Paragraph("FastAPI, Pydantic v2, Asyncpg, Cached Model Routing", body_style),
            Paragraph("Sub-50ms query latency; <b>85%+ gross margin</b> via intelligent context caching.", body_style)
        ],
        [
            Paragraph("<b>Platform Gateways</b>", body_bold),
            Paragraph("Official LinkedIn Posts API, OAuth 2.0 PKCE, Webhook Listeners", body_style),
            Paragraph("Compliant, direct-to-platform publishing that eliminates risky browser automation.", body_style)
        ],
    ], colWidths=[2.0*inch, 4.2*inch, 3.9*inch])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#111827")),
        ('BACKGROUND', (0,1), (-1,-1), c_card),
        ('BOX', (0,0), (-1,-1), 1, c_card_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_card_border),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 6))
    story.append(make_speaker_box("Our technical defensibility is anchored in our Hierarchical MemoryEngine and context caching architecture. By indexing client knowledge locally, we achieve sub-50ms response times and protect our 85% gross margins while ensuring enterprise-grade tenant privacy."))
    story.append(PageBreak())

    # -------------------------------------------------------------
    # SLIDE 5: MARKET OPPORTUNITY (NAIRA)
    # -------------------------------------------------------------
    story.append(Paragraph("SLIDE 05 // MARKET OPPORTUNITY & EXPANSION (&#8358;)", slide_cat_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph("A Multi-Billion Naira Market Ready for Autonomous Disruption", heading_style))
    story.append(Paragraph("Tapping into the explosion of B2B social selling, executive branding, and SME digital marketing.", body_style))
    story.append(Spacer(1, 6))

    m1 = make_card(
        Paragraph("TAM: &#8358;1.5 Trillion+", card_title_style),
        [
            Paragraph("<b>African & Global Social Media Marketing & AI Agent Market</b> by 2030 (23.6% CAGR).", body_style),
            Paragraph("Over 40M+ MSMEs across Africa transitioning to digital and social selling channels.", body_style)
        ],
        width=3.25*inch
    )
    m2 = make_card(
        Paragraph("SAM: &#8358;350 Billion", card_title_indigo),
        [
            Paragraph("<b>High-Growth Tech Startups, Knowledge Consultants, SMEs & Agencies</b> across Nigeria and Africa.", body_style),
            Paragraph("Over 3.5M+ formal registered businesses actively budgeting for digital growth and client acquisition.", body_style)
        ],
        width=3.25*inch
    )
    m3 = make_card(
        Paragraph("SOM: &#8358;25 Billion", card_title_style),
        [
            Paragraph("<b>Initial Beachhead:</b> 50,000+ Venture-backed founders, fintech execs, and top B2B digital agencies.", body_style),
            Paragraph("Immediate willingness to pay <b>&#8358;360,000–&#8358;900,000/year</b> to replace costly agency retainers.", body_style)
        ],
        width=3.25*inch
    )

    t_mkt = Table([[m1, m2, m3]], colWidths=[3.35*inch, 3.35*inch, 3.35*inch])
    t_mkt.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(t_mkt)
    story.append(Spacer(1, 8))

    m_drivers = Table([
        [
            Paragraph("<b>🎯 Land-and-Expand Growth</b><br/><font size=6.5 color='#9CA3AF'><b>Step 1:</b> Land CEO personal brand (&#8358;75k/mo).<br/><b>Step 2:</b> Expand to Exec Team (&#8358;250k/mo).<br/><b>Step 3:</b> Roll out Company-wide Employee Advocacy (&#8358;1M+/mo).</font>", ParagraphStyle('d1', textColor=c_text_light, fontSize=7.5, leading=10.5)),
            Paragraph("<b>💼 Executive Brand Dominance</b><br/><font size=6.5 color='#9CA3AF'>Founder profiles generate <b>8x higher engagement and trust</b> than corporate logos. B2B buyers purchase from people, making executive social presence a revenue necessity.</font>", ParagraphStyle('d2', textColor=c_text_light, fontSize=7.5, leading=10.5)),
            Paragraph("<b>🤝 Agency Reseller Multiplier</b><br/><font size=6.5 color='#9CA3AF'>Instead of competing with agencies in Lagos/London, Dexter empowers them to 10x client capacity. 1 agency partner brings 20–50 managed client workspaces.</font>", ParagraphStyle('d3', textColor=c_text_light, fontSize=7.5, leading=10.5))
        ]
    ], colWidths=[3.35*inch, 3.35*inch, 3.35*inch])
    m_drivers.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#111827")),
        ('BOX', (0,0), (-1,-1), 1, c_card_border),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(m_drivers)
    story.append(Spacer(1, 6))
    story.append(make_speaker_box("Our addressable beachhead in Nigeria and the broader African tech ecosystem represents over 25 Billion Naira in immediate recurring demand. We land with founders who urgently need pipeline and visibility, then expand into executive teams and agency partner networks."))
    story.append(PageBreak())

    # -------------------------------------------------------------
    # SLIDE 6: BUSINESS MODEL & PRICING (NAIRA)
    # -------------------------------------------------------------
    story.append(Paragraph("SLIDE 06 // MONETIZATION & UNIT ECONOMICS (&#8358;)", slide_cat_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph("High-Margin SaaS Model Built for Scale", heading_style))
    story.append(Paragraph("Transparent tiered subscription pricing with exceptional unit economics and compounding switching barriers.", body_style))
    story.append(Spacer(1, 6))

    pr1 = make_card(
        Paragraph("STARTER // &#8358;30,000/mo", card_title_style),
        [
            Paragraph("<b>Target:</b> Solopreneurs & Creators", body_bold),
            Paragraph("• 1 Social Profile (LinkedIn)<br/>• 5-Min Voice Brand Setup<br/>• 30 Posts & Graphics/mo<br/>• Core Brand Memory Engine<br/>• Autonomous Publishing Queue", body_style),
        ],
        width=3.25*inch
    )
    pr2 = make_card(
        Paragraph("FOUNDER PRO // &#8358;75,000/mo", card_title_indigo),
        [
            Paragraph("<b>Target:</b> Tech Founders & Execs", body_bold),
            Paragraph("• Multi-platform (LinkedIn, X)<br/>• Real-Time Voice & Text Copilot<br/>• Custom AI Graphics & Carousels<br/>• Closed-Loop Analytics Engine<br/>• Priority Async Processing", body_style),
        ],
        border_color=c_indigo,
        width=3.25*inch
    )
    pr3 = make_card(
        Paragraph("AGENCY & TEAMS // &#8358;250,000+/mo", card_title_style),
        [
            Paragraph("<b>Target:</b> Agencies & Multi-Seat Teams", body_bold),
            Paragraph("• 10+ Profiles & Multi-Brains<br/>• Multi-seat Team Collaboration<br/>• White-Label Executive Reports<br/>• Client Onboarding Links<br/>• Custom API & Webhooks", body_style),
        ],
        width=3.25*inch
    )

    t_pricing = Table([[pr1, pr2, pr3]], colWidths=[3.35*inch, 3.35*inch, 3.35*inch])
    t_pricing.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(t_pricing)
    story.append(Spacer(1, 8))

    econ_table = Table([
        [
            Paragraph("<b>85%</b><br/><font size=6.5 color='#9CA3AF'>Gross Software Margin</font>", stat_num_style),
            Paragraph("<b>&#8358;900,000</b><br/><font size=6.5 color='#9CA3AF'>Blended Annual ACV / Customer</font>", stat_num_style),
            Paragraph("<b>5.2x</b><br/><font size=6.5 color='#9CA3AF'>Target LTV to CAC Ratio</font>", stat_num_style),
            Paragraph("<b>128%</b><br/><font size=6.5 color='#9CA3AF'>Target Net Dollar Retention (NDR)</font>", stat_num_style),
        ]
    ], colWidths=[2.52*inch, 2.52*inch, 2.52*inch, 2.52*inch])
    econ_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#111827")),
        ('BOX', (0,0), (-1,-1), 1, c_card_border),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(econ_table)
    story.append(Spacer(1, 6))
    story.append(make_speaker_box("Our unit economics are exceptionally attractive. Our starter tier at 30,000 Naira per month is accessible to every creator, while our 75,000 Naira Founder tier and 250,000+ Naira Agency plans capture serious enterprise value. With 85% gross margins and compounding memory retention, Dexter delivers unmatched profitability."))
    story.append(PageBreak())

    # -------------------------------------------------------------
    # SLIDE 7: TRACTION & PRODUCT VALIDATION
    # -------------------------------------------------------------
    story.append(Paragraph("SLIDE 07 // TRACTION & TECHNICAL VALIDATION", slide_cat_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph("Proven Execution: Live System Operating End-to-End", heading_style))
    story.append(Paragraph("Dexter is fully functional with live API infrastructure, interactive voice streaming, and validated customer engagement.", body_style))
    story.append(Spacer(1, 6))

    tr1 = make_card(
        Paragraph("✅ Live Platform Publishing", card_title_style),
        [
            Paragraph("• Official OAuth 2.0 token handshake with secure encrypted storage.", body_style),
            Paragraph("• Verified real-time publishing to live LinkedIn feeds with author URN resolution.", body_style),
        ],
        width=3.25*inch
    )
    tr2 = make_card(
        Paragraph("✅ Real-Time Voice Onboarding", card_title_indigo),
        [
            Paragraph("• Speech-to-text with tone extraction operational across mobile and web.", body_style),
            Paragraph("• Transforms 5 minutes of conversational speech into structured brand pillars in <30s.", body_style),
        ],
        width=3.25*inch
    )
    tr3 = make_card(
        Paragraph("✅ Multimodal Dexter Copilot", card_title_style),
        [
            Paragraph("• Real-time voice and text prompt copilot for immediate post iteration.", body_style),
            Paragraph("• Automatic carousel framing and branded visual asset synthesis.", body_style),
        ],
        width=3.25*inch
    )

    t_tr = Table([[tr1, tr2, tr3]], colWidths=[3.35*inch, 3.35*inch, 3.35*inch])
    t_tr.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(t_tr)
    story.append(Spacer(1, 8))

    m_box = Table([
        [
            Paragraph("<b>4.2x Consistency Lift</b><br/><font size=6.5 color='#9CA3AF'>Increase in weekly posting volume among early pilot founders</font>", stat_num_style),
            Paragraph("<b>94% Draft Acceptance</b><br/><font size=6.5 color='#9CA3AF'>Of generated posts approved with 0 or minor voice edits</font>", stat_num_style),
            Paragraph("<b>< 45 Mins/Wk</b><br/><font size=6.5 color='#9CA3AF'>Total management time required vs. 16 hours previously</font>", stat_num_style),
        ]
    ], colWidths=[3.35*inch, 3.35*inch, 3.35*inch])
    m_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#111827")),
        ('BOX', (0,0), (-1,-1), 1, c_card_border),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(m_box)
    story.append(Spacer(1, 6))
    story.append(make_speaker_box("We are not raising capital on slide concepts. Dexter is fully built and deployed. We have live OAuth handshakes, authentic feed publishing, real-time voice onboarding, and a functional copilot. Our early beta users have gone from struggling with consistency to posting daily, cutting their weekly social overhead by over 90%."))
    story.append(PageBreak())

    # -------------------------------------------------------------
    # SLIDE 8: COMPETITIVE LANDSCAPE & MOAT
    # -------------------------------------------------------------
    story.append(Paragraph("SLIDE 08 // COMPETITIVE ADVANTAGE & DEFENSIVE MOAT", slide_cat_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph("Category Differentiation: Why Dexter Is Defensible", heading_style))
    story.append(Paragraph("Comparing Dexter against legacy schedulers, stateless AI wrappers, and traditional human agencies.", body_style))
    story.append(Spacer(1, 6))

    comp_matrix = Table([
        [
            Paragraph("<b>STRATEGIC ATTRIBUTE</b>", ParagraphStyle('CM0', fontName='Helvetica-Bold', fontSize=7.5, textColor=c_emerald)),
            Paragraph("<b>LEGACY SCHEDULERS</b><br/>(Buffer, Hootsuite)", ParagraphStyle('CM1', fontName='Helvetica-Bold', fontSize=7, textColor=c_text_muted)),
            Paragraph("<b>STATELESS AI</b><br/>(ChatGPT, Jasper)", ParagraphStyle('CM2', fontName='Helvetica-Bold', fontSize=7, textColor=c_text_muted)),
            Paragraph("<b>TRADITIONAL AGENCIES</b><br/>(Lagos / London Retainers)", ParagraphStyle('CM3', fontName='Helvetica-Bold', fontSize=7, textColor=c_text_muted)),
            Paragraph("<b>DEXTER AI</b><br/>(Autonomous Teammate)", ParagraphStyle('CM4', fontName='Helvetica-Bold', fontSize=7.5, textColor=c_emerald)),
        ],
        [
            Paragraph("<b>Conversational Voice Onboarding</b>", body_bold),
            Paragraph("❌ None", body_style),
            Paragraph("❌ Manual Prompting", body_style),
            Paragraph("⚠️ 2-Hour Zoom Calls", body_style),
            Paragraph("<b>✅ 5-Min Interactive Voice</b>", ParagraphStyle('CG1', fontName='Helvetica-Bold', fontSize=8, textColor=c_emerald)),
        ],
        [
            Paragraph("<b>Persistent Brand Memory Engine</b>", body_bold),
            Paragraph("❌ None", body_style),
            Paragraph("❌ Stateless / Forgets", body_style),
            Paragraph("⚠️ Fragmented Docs", body_style),
            Paragraph("<b>✅ Contextual MemoryEngine</b>", ParagraphStyle('CG2', fontName='Helvetica-Bold', fontSize=8, textColor=c_emerald)),
        ],
        [
            Paragraph("<b>Native API Publishing</b>", body_bold),
            Paragraph("✅ Manual Schedule Only", body_style),
            Paragraph("❌ Copy-Paste Required", body_style),
            Paragraph("✅ Manual Human Posting", body_style),
            Paragraph("<b>✅ Autonomous API Publishing</b>", ParagraphStyle('CG3', fontName='Helvetica-Bold', fontSize=8, textColor=c_emerald)),
        ],
        [
            Paragraph("<b>Closed-Loop Optimization</b>", body_bold),
            Paragraph("⚠️ Passive Charts Only", body_style),
            Paragraph("❌ Disconnected", body_style),
            Paragraph("⚠️ Monthly PDF Slides", body_style),
            Paragraph("<b>✅ Real-Time Memory Tuning</b>", ParagraphStyle('CG4', fontName='Helvetica-Bold', fontSize=8, textColor=c_emerald)),
        ],
        [
            Paragraph("<b>Total Monthly Cost / Time</b>", body_bold),
            Paragraph("&#8358;25k–&#8358;75k/mo (15 hrs/wk)", body_style),
            Paragraph("&#8358;35k–&#8358;65k/mo (15 hrs/wk)", body_style),
            Paragraph("&#8358;300k–&#8358;1M/mo (Slow)", body_style),
            Paragraph("<b>&#8358;30k–&#8358;75k/mo (45 mins/wk)</b>", ParagraphStyle('CG5', fontName='Helvetica-Bold', fontSize=8, textColor=c_emerald)),
        ],
    ], colWidths=[2.55*inch, 1.85*inch, 1.85*inch, 1.95*inch, 1.9*inch])
    comp_matrix.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#111827")),
        ('BACKGROUND', (4,0), (4,-1), colors.HexColor("#06241C")),
        ('BOX', (0,0), (-1,-1), 1, c_card_border),
        ('BOX', (4,0), (4,-1), 1.2, c_emerald),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_card_border),
        ('PADDING', (0,0), (-1,-1), 3.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(comp_matrix)
    story.append(Spacer(1, 6))
    story.append(make_speaker_box("Our moat is built on two pillars: the proprietary MemoryEngine and our closed execution loop. Schedulers don't have intelligence. AI writers don't have memory or publishing capabilities. Agencies are too slow and expensive. Dexter sits in a category of one as an integrated autonomous employee."))
    story.append(PageBreak())

    # -------------------------------------------------------------
    # SLIDE 9: GO-TO-MARKET FLYWHEEL
    # -------------------------------------------------------------
    story.append(Paragraph("SLIDE 09 // GO-TO-MARKET FLYWHEEL & SCALING", slide_cat_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph("Product-Led Flywheel & High-Velocity Distribution", heading_style))
    story.append(Paragraph("Combining viral peer-to-peer social proof, interactive top-of-funnel tooling, and agency partner channel sales.", body_style))
    story.append(Spacer(1, 6))

    gtm1 = make_card(
        Paragraph("1. Organic Peer Flywheel", card_title_style),
        [
            Paragraph("• Founders and executives actively publish high-performing thought leadership.", body_style),
            Paragraph("• Other founders ask: <i>'How do you post every single day with such depth?'</i> driving organic word-of-mouth.", body_style),
        ],
        width=3.25*inch
    )
    gtm2 = make_card(
        Paragraph("2. 3-Min Interactive Voice Hook", card_title_indigo),
        [
            Paragraph("• Free web-based voice brand teardown on our landing page.", body_style),
            Paragraph("• Generates 3 personalized high-converting post drafts before signup, creating an instant 'aha' moment.", body_style),
        ],
        width=3.25*inch
    )
    gtm3 = make_card(
        Paragraph("3. Agency Partner Distribution", card_title_style),
        [
            Paragraph("• Turn marketing agencies into resellers with white-label multi-client dashboards.", body_style),
            Paragraph("• Agencies 10x their capacity, bringing 15–50 paying accounts per partner with zero acquisition cost.", body_style),
        ],
        width=3.25*inch
    )

    t_gtm = Table([[gtm1, gtm2, gtm3]], colWidths=[3.35*inch, 3.35*inch, 3.35*inch])
    t_gtm.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(t_gtm)
    story.append(Spacer(1, 8))

    gtm_timeline = Table([
        [
            Paragraph("<b>PHASE 1: MONTHS 1–6</b><br/><font size=6.5 color='#10B981'><b>Founder Beachhead & PLG</b></font><br/>• Focus on B2B SaaS Founders on LinkedIn<br/>• Self-serve voice onboarding optimization<br/>• Reach &#8358;5M MRR with 100 paying subscribers", ParagraphStyle('R1', textColor=c_text_light, fontSize=7, leading=9.5)),
            Paragraph("<b>PHASE 2: MONTHS 6–12</b><br/><font size=6.5 color='#6366F1'><b>Multi-Platform & Agency Rollout</b></font><br/>• Expand native posting to X, Threads, IG<br/>• Launch Agency Partner certification<br/>• Scale to &#8358;15M MRR (&#8358;180M ARR)", ParagraphStyle('R2', textColor=c_text_light, fontSize=7, leading=9.5)),
            Paragraph("<b>PHASE 3: MONTHS 12–18</b><br/><font size=6.5 color='#8B5CF6'><b>Enterprise Advocacy Hubs</b></font><br/>• Enterprise corporate multi-seat hubs<br/>• Ingest Notion, Slack & Google Docs knowledge<br/>• Scale to <b>&#8358;25M+ MRR (&#8358;300M+ ARR)</b>", ParagraphStyle('R3', textColor=c_text_light, fontSize=7, leading=9.5)),
        ]
    ], colWidths=[3.35*inch, 3.35*inch, 3.35*inch])
    gtm_timeline.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#111827")),
        ('BOX', (0,0), (-1,-1), 1, c_card_border),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(gtm_timeline)
    story.append(Spacer(1, 6))
    story.append(make_speaker_box("Our GTM strategy leverages product virality. Every post published by a customer is a live advertisement. We combine this with a free 3-minute voice audit tool that converts visitors into active subscribers on day one, supplemented by our agency partner program."))
    story.append(PageBreak())

    # -------------------------------------------------------------
    # SLIDE 10: THE ASK & 18-MONTH FINANCIAL ROADMAP (NAIRA)
    # -------------------------------------------------------------
    story.append(Paragraph("SLIDE 10 // THE ASK & 18-MONTH CAPITAL ALLOCATION (&#8358;)", slide_cat_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph("Funding the Autonomous Marketing Future", heading_style))
    story.append(Paragraph("We are raising &#8358;100,000,000 Seed Financing to scale our core AI engine, expand platform integrations, and capture market dominance.", body_style))
    story.append(Spacer(1, 6))

    ask1 = make_card(
        Paragraph("💰 The Seed Round Target", card_title_style),
        [
            Paragraph("<b>&#8358;100,000,000 Seed Financing</b>", ParagraphStyle('A1', fontName='Helvetica-Bold', fontSize=12, textColor=c_emerald)),
            Paragraph("• 18–24 months of operational runway.<br/>• Expand core AI engineering & context retrieval.<br/>• Scale self-serve PLG acquisition engine across Nigeria, Africa & Global.", body_style)
        ],
        width=3.25*inch
    )
    ask2 = make_card(
        Paragraph("📊 Strategic Capital Allocation", card_title_indigo),
        [
            Paragraph("• <b>50% AI Research & Engineering (&#8358;50M):</b> MemoryEngine, multimodal generation, and context caching.<br/>• <b>30% Go-To-Market & Growth (&#8358;30M):</b> PLG funnel, creator partnerships, and agency enablement.<br/>• <b>15% Platform APIs & Integrations (&#8358;15M):</b> Expanding official platform connections.<br/>• <b>5% Legal & Operations (&#8358;5M):</b> Compliance & IP.", body_style)
        ],
        width=3.25*inch
    )
    ask3 = make_card(
        Paragraph("🎯 18-Month Key Milestones", card_title_style),
        [
            Paragraph("• <b>&#8358;25,000,000+ MRR (&#8358;300,000,000 ARR)</b>.<br/>• 1,200+ Active Paying Businesses & Founders.<br/>• 4+ Major Social Platforms Supported (LinkedIn, X, Threads, IG).<br/>• 40+ Active Agency Distribution Partners.", body_style)
        ],
        width=3.25*inch
    )

    t_ask = Table([[ask1, ask2, ask3]], colWidths=[3.35*inch, 3.35*inch, 3.35*inch])
    t_ask.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP')]))
    story.append(t_ask)
    story.append(Spacer(1, 8))

    contact_box = Table([
        [
            Paragraph("<b>FOUNDER & LEADERSHIP</b><br/><font color='#F9FAFB' size=9><b>Okoh Frank</b> — Founder & Lead Architect</font><br/><font color='#9CA3AF' size=7>Email: kingfrankini14@gmail.com • Web: dexter.ai • Location: Lagos / London / Remote</font>", ParagraphStyle('FC', textColor=c_text_light, fontSize=7.5, leading=10)),
            Paragraph("<font color='#10B981' size=11><b>JOIN US IN BUILDING<br/>THE FUTURE OF WORK</b></font>", ParagraphStyle('FC2', alignment=TA_CENTER, textColor=c_emerald, fontSize=9.5, leading=12))
        ]
    ], colWidths=[6.6*inch, 3.5*inch])
    contact_box.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#111827")),
        ('BOX', (0,0), (-1,-1), 1, c_emerald),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(contact_box)
    story.append(Spacer(1, 6))
    story.append(make_speaker_box("We are raising 100 Million Naira in Seed capital to scale Dexter into the default autonomous social media employee for high-growth businesses. In 18 months, we will reach over 25 Million Naira in monthly recurring revenue with 1,200+ customers. Thank you for your time, and we'd love to answer any questions."))

    def draw_slide_background(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(colors.HexColor("#0B0F19"))
        canvas.rect(0, 0, doc.pagesize[0], doc.pagesize[1], fill=True, stroke=False)
        
        canvas.setFillColor(colors.HexColor("#10B981"))
        canvas.rect(0, doc.pagesize[1] - 4, doc.pagesize[0], 4, fill=True, stroke=False)

        canvas.setStrokeColor(colors.HexColor("#1E293B"))
        canvas.setLineWidth(0.75)
        canvas.line(0.45 * inch, 0.38 * inch, doc.pagesize[0] - 0.45 * inch, 0.38 * inch)

        canvas.setFont("Helvetica-Bold", 7.5)
        canvas.setFillColor(colors.HexColor("#6B7280"))
        canvas.drawString(0.45 * inch, 0.24 * inch, "DEXTER AI // INVESTOR PRESENTATION — NAIRA STRATEGIC BLUEPRINT")

        canvas.setFont("Helvetica", 7.5)
        canvas.drawRightString(doc.pagesize[0] - 0.45 * inch, 0.24 * inch, f"Page {canvas._pageNumber} of 10  |  CONFIDENTIAL")
        canvas.restoreState()

    doc.build(story, onFirstPage=draw_slide_background, onLaterPages=draw_slide_background)
    print(f"Successfully generated updated Naira 10-page pitch deck PDF at: {output_path}")

if __name__ == "__main__":
    create_naira_pitch_deck()
