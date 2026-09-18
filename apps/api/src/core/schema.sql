-- ==============================================================================
-- DISK INTERNO - CORE RELACIONAL POSTGRESQL SCHEMA (v1.1)
-- Principio Central: Produtor -> Evento -> Cliente -> Pedido -> Ingresso -> Pagamento -> Repasse
-- ==============================================================================

-- 1. PRODUTORES (Empresas organizadoras de eventos)
CREATE TABLE producers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
    commission_rate DECIMAL(5, 4) DEFAULT 0.0800, -- ex: 0.08 = 8%
    bank_name VARCHAR(100) NOT NULL,
    bank_agency VARCHAR(20) NOT NULL,
    bank_account VARCHAR(30) NOT NULL,
    pix_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EVENTOS
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producer_id UUID NOT NULL REFERENCES producers(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    venue VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    event_date DATE NOT NULL,
    doors_open TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'published' CHECK (status IN ('published', 'on_sale', 'in_operation', 'completed', 'cancelled')),
    total_capacity INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SETORES & LOTES DO EVENTO
CREATE TABLE event_sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL,
    current_batch INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CLIENTES (Compradores unificados em todos os canais)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(2),
    is_blacklisted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PEDIDOS (Ordem de compra central)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL, -- ex: "DK-98421"
    producer_id UUID NOT NULL REFERENCES producers(id),
    event_id UUID NOT NULL REFERENCES events(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    items_count INTEGER NOT NULL DEFAULT 1,
    gross_amount DECIMAL(10, 2) NOT NULL,
    service_fee DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'partially_refunded', 'chargeback', 'cancelled')),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('credit_card', 'pix', 'boleto')),
    utm_source VARCHAR(100),
    utm_campaign VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INGRESSOS INDIVIDUAIS NOMINATIVOS
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_code VARCHAR(100) UNIQUE NOT NULL, -- ex: "TKT-98421-01"
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id),
    sector_id UUID NOT NULL REFERENCES event_sectors(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    nominal_attendee VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    fee DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'cancelled', 'refunded', 'blocked')),
    check_in_at TIMESTAMPTZ,
    check_in_gate VARCHAR(50),
    qr_code_payload TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PAGAMENTOS / TRANSAÇÕES DE GATEWAY
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    gateway VARCHAR(50) NOT NULL, -- 'Cielo', 'Rede', 'PIX_BancoCentral'
    gateway_transaction_id VARCHAR(150) NOT NULL,
    method VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    net_amount DECIMAL(10, 2) NOT NULL,
    gateway_fee DECIMAL(10, 2) NOT NULL,
    disk_fee DECIMAL(10, 2) NOT NULL,
    installments INTEGER DEFAULT 1,
    card_last4 VARCHAR(4),
    card_brand VARCHAR(50),
    paid_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'settled'
);

-- 8. REPASSES FINANCEIROS AOS PRODUTORES
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producer_id UUID NOT NULL REFERENCES producers(id),
    event_id UUID NOT NULL REFERENCES events(id),
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'processing', 'completed', 'blocked')),
    scheduled_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    bank_info TEXT NOT NULL,
    audit_approval_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SOLICITAÇÕES DE ESTORNO & CHARGEBACK
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    event_id UUID NOT NULL REFERENCES events(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    type VARCHAR(50) DEFAULT 'total' CHECK (type IN ('total', 'partial')),
    amount DECIMAL(10, 2) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    reason_description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'rejected', 'processed')),
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    requested_by VARCHAR(255) NOT NULL,
    approved_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CONTABILIDADE (Lançamentos em Partidas Dobradas)
CREATE TABLE accounting_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number VARCHAR(100) UNIQUE NOT NULL,
    entry_date DATE NOT NULL,
    order_id UUID REFERENCES orders(id),
    event_id UUID REFERENCES events(id),
    debit_account VARCHAR(150) NOT NULL,
    credit_account VARCHAR(150) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'posted',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TRILHA DE AUDITORIA IMUTÁVEL (AUDIT TRAIL)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(150) NOT NULL,
    module VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    impact_cascade JSONB,
    ip_address VARCHAR(45) NOT NULL
);

-- ÍNDICES DE ALTA PERFORMANCE
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_tickets_code ON tickets(ticket_code);
CREATE INDEX idx_tickets_order ON tickets(order_id);
CREATE INDEX idx_customers_cpf ON customers(cpf);
CREATE INDEX idx_events_producer ON events(producer_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
