import CashflowSection from './dashboard/CashflowSection';
import AccountsSection from './dashboard/AccountsSection';
import TabsClient from './dashboard/TabsClient';

export default function DashboardTabs() {
  return (
    <TabsClient
      tabs={[
        { key: 'cashflow', label: 'Cashflow', content: <CashflowSection /> },
        { key: 'accounts', label: 'Accounts', content: <AccountsSection /> }
      ]}
    />
  );
}
