import React from 'react';
import { useBilling } from '@/context/BillingContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, Phone, Smartphone, Database, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Admin: React.FC = () => {
  const { subscribers, hasTursoDB } = useBilling();

  const missingPhone = subscribers.filter(s => !s.phone || s.phone === '');
  const missingCustomerId = subscribers.filter(s => !s.customerId || s.customerId === '');

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold">Admin Management</h1>
        <p className="text-muted-foreground mt-1">Review system health and complete missing subscriber records.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6 border-orange-500/20 bg-orange-500/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Missing Phone Numbers</h2>
              <p className="text-xs text-muted-foreground">{missingPhone.length} subscribers need updates</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            These subscribers were imported from Excel without contact details. You can update them in the Subscribers page.
          </p>
          <Button variant="outline" className="w-full border-orange-500/30 text-orange-500 hover:bg-orange-500/10" asChild>
            <Link to="/subscribers">Fix Missing Phones</Link>
          </Button>
        </div>

        <div className="glass-card rounded-2xl p-6 border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Missing Customer IDs</h2>
              <p className="text-xs text-muted-foreground">{missingCustomerId.length} subscribers need updates</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Customer IDs are required for technical support and tracking.
          </p>
          <Button variant="outline" className="w-full border-blue-500/30 text-blue-500 hover:bg-blue-500/10" asChild>
            <Link to="/subscribers">Fix Missing Customer IDs</Link>
          </Button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-8 border-primary/20">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Data Source Information</h2>
            <p className="text-sm text-muted-foreground">Status of the current data layer</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="font-medium">LocalStorage Mode</p>
                <p className="text-xs text-muted-foreground">Active (Local Data: {subscribers.length} records)</p>
              </div>
            </div>
            <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-md font-semibold">STABLE</span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className={`h-5 w-5 rounded-full ${hasTursoDB ? 'bg-success' : 'border-2 border-dashed border-muted-foreground'}`} />
              <div>
                <p className="font-medium">Turso Cloud Database</p>
                <p className="text-xs text-muted-foreground">
                  {hasTursoDB ? 'Connected (Synced)' : 'Inactive (No DB_URL provided)'}
                </p>
              </div>
            </div>
            <span className={`text-xs ${hasTursoDB ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'} px-2 py-1 rounded-md font-semibold`}>
              {hasTursoDB ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/60">
          <h3 className="font-semibold mb-2">Import Tool</h3>
          <p className="text-sm text-muted-foreground mb-4">
            If you need to re-run the import from Biju's project Excel, use the dedicated tool.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-primary text-primary-foreground">
              <Link to="/import">Open Import Tool</Link>
            </Button>
            <Button asChild variant="outline" className="border-primary/20 text-primary hover:bg-primary/5">
              <Link to="/backup">Data Backup & Restore</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;

