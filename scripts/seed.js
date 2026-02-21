require('dotenv').config();

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.webhookLog.deleteMany();
  await prisma.webhookEndpoint.deleteMany();
  await prisma.ticketFile.deleteMany();
  await prisma.ticketReply.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatSession.deleteMany();
  await prisma.fAQ.deleteMany();
  await prisma.knowledgeBase.deleteMany();
  await prisma.tenant.deleteMany();

  // Create demo tenant
  const passwordHash = await bcrypt.hash('demo123', 12);
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo Company',
      email: 'demo@supporthub.com',
      passwordHash,
      apiKey: `tk_${uuidv4().replace(/-/g, '')}`,
      plan: 'pro',
      botConfig: {
        name: 'Demo Support Bot',
        greeting: 'Hi there! Welcome to Demo Company support. How can I help you today?',
        systemPrompt: 'You are a friendly and helpful customer support assistant for Demo Company, an e-commerce platform that sells electronics and gadgets. Be concise, empathetic, and always try to resolve issues on the first interaction. If you cannot resolve an issue, offer to create a support ticket.',
        tone: 'friendly',
        language: 'en',
      },
      brandConfig: {
        name: 'Demo Company',
        logo: '',
        accent: '#4F46E5',
      },
      channelConfig: {
        chat: true,
        voice: false,
        voiceNote: true,
        call: false,
        faq: true,
        tickets: true,
        fileAttach: true,
      },
      fileConfig: {
        maxSizeMb: 10,
        allowedTypes: ['image/png', 'image/jpeg', 'application/pdf', 'text/plain'],
        maxFiles: 5,
      },
      rateLimitConfig: {
        messagesPerMin: 15,
        messagesPerDay: 200,
        tokensPerMsg: 2000,
      },
    },
  });

  console.log(`Created tenant: ${tenant.email} (API Key: ${tenant.apiKey})`);

  // Create 5 Knowledge Base articles
  const kbArticles = await Promise.all([
    prisma.knowledgeBase.create({
      data: {
        tenantId: tenant.id,
        title: 'Return Policy',
        content: 'Our return policy allows customers to return products within 30 days of purchase for a full refund. Items must be in their original packaging and unused condition. To initiate a return, customers should contact our support team with their order number. Refunds are processed within 5-7 business days after we receive the returned item. Shipping costs for returns are covered by Demo Company for defective items. For non-defective returns, customers are responsible for return shipping costs.',
        category: 'policies',
        tags: ['returns', 'refund', 'policy', 'shipping'],
        sourceType: 'text',
      },
    }),
    prisma.knowledgeBase.create({
      data: {
        tenantId: tenant.id,
        title: 'Shipping Information',
        content: 'We offer three shipping options: Standard (5-7 business days, free on orders over $50), Express (2-3 business days, $9.99), and Next Day ($19.99). All orders are shipped from our warehouse in Austin, TX. Tracking numbers are sent via email once the order ships. International shipping is available to select countries with delivery times of 10-15 business days. Orders placed before 2 PM EST ship the same day.',
        category: 'shipping',
        tags: ['shipping', 'delivery', 'tracking', 'international'],
        sourceType: 'text',
      },
    }),
    prisma.knowledgeBase.create({
      data: {
        tenantId: tenant.id,
        title: 'Product Warranty Guide',
        content: 'All electronics purchased from Demo Company come with a 1-year manufacturer warranty. Extended warranty options (2-year and 3-year) are available at checkout. Warranty covers manufacturing defects but does not cover physical damage, water damage, or unauthorized modifications. To file a warranty claim, customers need their order number and photos of the defective product. Warranty replacements are shipped within 3-5 business days.',
        category: 'warranty',
        tags: ['warranty', 'defect', 'replacement', 'coverage'],
        sourceType: 'url',
        sourceUrl: 'https://democompany.com/warranty',
      },
    }),
    prisma.knowledgeBase.create({
      data: {
        tenantId: tenant.id,
        title: 'Account Management FAQ',
        content: 'Customers can create an account on our website to track orders, save addresses, and view order history. To reset a password, click "Forgot Password" on the login page. Email preferences can be managed in Account Settings. To delete an account, contact support. Two-factor authentication is available for enhanced security. Account holders get early access to sales and exclusive discounts.',
        category: 'account',
        tags: ['account', 'password', 'login', 'security', 'settings'],
        sourceType: 'text',
      },
    }),
    prisma.knowledgeBase.create({
      data: {
        tenantId: tenant.id,
        title: 'Troubleshooting Common Issues',
        content: 'For device not turning on: Try holding the power button for 10 seconds, then release and press again. If the device still does not power on, try a different charging cable. For connectivity issues: Restart the device, forget the Bluetooth/WiFi connection, and re-pair. For app crashes: Clear the app cache in Settings > Apps, or reinstall the app. For battery drain: Check for background apps, reduce screen brightness, and disable location services when not needed.',
        category: 'troubleshooting',
        tags: ['troubleshooting', 'device', 'power', 'battery', 'connectivity'],
        sourceType: 'file',
        fileName: 'troubleshooting-guide.pdf',
        filePath: '/uploads/demo/troubleshooting-guide.pdf',
      },
    }),
  ]);

  console.log(`Created ${kbArticles.length} knowledge base articles`);

  // Create 5 FAQs
  const faqs = await Promise.all([
    prisma.fAQ.create({
      data: {
        tenantId: tenant.id,
        question: 'How do I track my order?',
        answer: 'You can track your order by logging into your account and visiting the "My Orders" section. You will also receive a tracking email once your order ships with a direct link to the carrier\'s tracking page.',
        category: 'orders',
        sortOrder: 1,
      },
    }),
    prisma.fAQ.create({
      data: {
        tenantId: tenant.id,
        question: 'What payment methods do you accept?',
        answer: 'We accept Visa, Mastercard, American Express, PayPal, Apple Pay, and Google Pay. All transactions are secured with 256-bit SSL encryption.',
        category: 'payments',
        sortOrder: 2,
      },
    }),
    prisma.fAQ.create({
      data: {
        tenantId: tenant.id,
        question: 'How do I contact customer support?',
        answer: 'You can reach us through our live chat widget on the website, by email at support@democompany.com, or by submitting a support ticket through your account dashboard. Our support team is available Monday through Friday, 9 AM to 6 PM EST.',
        category: 'general',
        sortOrder: 3,
      },
    }),
    prisma.fAQ.create({
      data: {
        tenantId: tenant.id,
        question: 'Can I change or cancel my order?',
        answer: 'Orders can be modified or cancelled within 1 hour of placement. After that, the order enters processing and cannot be changed. Please contact support immediately if you need to make changes to a recent order.',
        category: 'orders',
        sortOrder: 4,
      },
    }),
    prisma.fAQ.create({
      data: {
        tenantId: tenant.id,
        question: 'Do you offer bulk or wholesale pricing?',
        answer: 'Yes, we offer bulk pricing for orders of 10+ units. Please contact our sales team at sales@democompany.com or fill out the wholesale inquiry form on our website for a custom quote.',
        category: 'pricing',
        sortOrder: 5,
      },
    }),
  ]);

  console.log(`Created ${faqs.length} FAQs`);

  // Create 3 tickets with replies
  const ticket1 = await prisma.supportTicket.create({
    data: {
      tenantId: tenant.id,
      ticketNo: 'TK-20260218-A1B2',
      email: 'alice@example.com',
      subject: 'Order not received after 10 days',
      description: 'I placed an order (#ORD-4521) on Feb 8th with standard shipping but still have not received it. The tracking page shows no updates since Feb 10th.',
      category: 'shipping',
      priority: 'high',
      status: 'in_progress',
      source: 'web',
    },
  });

  await prisma.ticketReply.createMany({
    data: [
      {
        ticketId: ticket1.id,
        from: 'ai',
        message: 'I\'m sorry to hear about the delay with your order. I\'ve looked up order #ORD-4521 and I can see the tracking hasn\'t been updated. Let me escalate this to our shipping team for investigation.',
      },
      {
        ticketId: ticket1.id,
        from: 'admin',
        message: 'Hi Alice, I\'ve contacted our shipping partner about your package. It appears there was a sorting issue at the distribution center. Your package has been located and will be delivered within 2 business days. We\'ve also added a $10 credit to your account for the inconvenience.',
      },
    ],
  });

  const ticket2 = await prisma.supportTicket.create({
    data: {
      tenantId: tenant.id,
      ticketNo: 'TK-20260219-C3D4',
      email: 'bob@example.com',
      subject: 'Defective wireless earbuds - left earbud not working',
      description: 'I purchased the ProSound X200 wireless earbuds last week. The left earbud stopped producing sound after 3 days of use. I\'ve tried resetting them multiple times.',
      category: 'warranty',
      priority: 'medium',
      status: 'open',
      source: 'chat',
    },
  });

  await prisma.ticketReply.create({
    data: {
      ticketId: ticket2.id,
      from: 'ai',
      message: 'I understand how frustrating that must be. Since your earbuds are within the warranty period, you\'re eligible for a free replacement. I\'ll create a warranty claim for you. Could you please provide your order number so we can process this quickly?',
    },
  });

  const ticket3 = await prisma.supportTicket.create({
    data: {
      tenantId: tenant.id,
      ticketNo: 'TK-20260220-E5F6',
      email: 'carol@example.com',
      subject: 'Request for invoice copy',
      description: 'I need a copy of my invoice for order #ORD-3892 for my business expense report. Could you please email it to me?',
      category: 'general',
      priority: 'low',
      status: 'resolved',
      source: 'web',
    },
  });

  await prisma.ticketReply.createMany({
    data: [
      {
        ticketId: ticket3.id,
        from: 'admin',
        message: 'Hi Carol, I\'ve sent the invoice for order #ORD-3892 to your email address. You can also download invoices anytime from the "Order History" section of your account.',
      },
      {
        ticketId: ticket3.id,
        from: 'customer',
        message: 'Got it, thank you for the quick response!',
      },
    ],
  });

  console.log('Created 3 tickets with replies');

  // Create 2 webhook endpoints
  const webhooks = await Promise.all([
    prisma.webhookEndpoint.create({
      data: {
        tenantId: tenant.id,
        name: 'Slack Notifications',
        url: 'https://hooks.slack.example.com/services/T00/B00/xxxx',
        secret: 'whsec_slack_demo_secret_key_12345',
        events: ['ticket_created', 'ticket_updated', 'chat_session_started'],
        isActive: true,
      },
    }),
    prisma.webhookEndpoint.create({
      data: {
        tenantId: tenant.id,
        name: 'CRM Integration',
        url: 'https://crm.example.com/api/webhooks/support-hub',
        secret: 'whsec_crm_demo_secret_key_67890',
        events: ['ticket_created', 'ticket_closed', 'chat_message'],
        isActive: true,
      },
    }),
  ]);

  console.log(`Created ${webhooks.length} webhook endpoints`);

  console.log('\n--- Seed Complete ---');
  console.log(`Tenant Email: demo@supporthub.com`);
  console.log(`Tenant Password: demo123`);
  console.log(`API Key: ${tenant.apiKey}`);
  console.log('--------------------\n');
}

main()
  .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
