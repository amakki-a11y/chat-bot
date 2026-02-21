import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import AnalyticsDashboard from '../components/analytics/AnalyticsDashboard';
import BotTraining from '../components/training/BotTraining';
import RateLimits from '../components/training/RateLimits';
import KBList from '../components/kb/KBList';
import FAQList from '../components/faq/FAQList';
import TicketList from '../components/tickets/TicketList';
import TicketDetail from '../components/tickets/TicketDetail';
import WebhookEndpoints from '../components/webhooks/WebhookEndpoints';
import ChannelSettings from '../components/channels/ChannelSettings';
import BrandingForm from '../components/branding/BrandingForm';
import WidgetPreview from '../components/preview/WidgetPreview';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<AnalyticsDashboard />} />
        <Route path="training" element={<BotTraining />} />
        <Route path="rate-limits" element={<RateLimits />} />
        <Route path="kb" element={<KBList />} />
        <Route path="faq" element={<FAQList />} />
        <Route path="tickets" element={<TicketList />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="webhooks" element={<WebhookEndpoints />} />
        <Route path="channels" element={<ChannelSettings />} />
        <Route path="branding" element={<BrandingForm />} />
        <Route path="preview" element={<WidgetPreview />} />
      </Routes>
    </DashboardLayout>
  );
}
