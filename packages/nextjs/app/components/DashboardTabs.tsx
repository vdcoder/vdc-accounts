import CashflowSection from './dashboard/CashflowSection';
import AccountsSection from './dashboard/AccountsSection';
import MonthlyIncomeSection from './dashboard/MonthlyIncomeSection';
import TabsClient from './dashboard/TabsClient';

export default function DashboardTabs() {
  return (
    <TabsClient
      tabs={[
        { key: 'cashflow', label: 'Cashflow', content: <CashflowSection /> },
        { key: 'monthly-income', label: 'Monthly Income Statement', content: <MonthlyIncomeSection /> },
        { key: 'accounts', label: 'Accounts', content: <AccountsSection /> }
      ]}
    />
  );
}
