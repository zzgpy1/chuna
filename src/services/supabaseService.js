import { supabase } from '../config/supabase';

// 供应商操作
export const supplierService = {
  async getAll() {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  
  async add(supplier) {
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{ ...supplier, created_at: new Date() }])
      .select();
    if (error) throw error;
    return data[0];
  },
  
  async update(id, supplier) {
    const { data, error } = await supabase
      .from('suppliers')
      .update(supplier)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },
  
  async delete(id) {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// 入库单操作
export const purchaseService = {
  async getAll() {
    const { data, error } = await supabase
      .from('purchases')
      .select('*, suppliers(name)')
      .order('purchase_date', { ascending: false });
    if (error) throw error;
    return data.map(p => ({ ...p, supplierName: p.suppliers?.name }));
  },
  
  async add(purchase) {
    const { data, error } = await supabase
      .from('purchases')
      .insert([purchase])
      .select();
    if (error) throw error;
    return data[0];
  },
  
  async update(id, purchase) {
    const { data, error } = await supabase
      .from('purchases')
      .update(purchase)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },
  
  async delete(id) {
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// 付款记录操作
export const paymentService = {
  async getAll() {
    const { data, error } = await supabase
      .from('payments')
      .select('*, suppliers(name), accounts(name)')
      .order('payment_date', { ascending: false });
    if (error) throw error;
    return data.map(p => ({ 
      ...p, 
      supplierName: p.suppliers?.name,
      accountName: p.accounts?.name 
    }));
  },
  
  async add(payment) {
    const { data, error } = await supabase
      .from('payments')
      .insert([payment])
      .select();
    if (error) throw error;
    return data[0];
  },
  
  async update(id, payment) {
    const { data, error } = await supabase
      .from('payments')
      .update(payment)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },
  
  async delete(id) {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

// 账户操作
export const accountService = {
  async getAll() {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  
  async add(account) {
    const { data, error } = await supabase
      .from('accounts')
      .insert([account])
      .select();
    if (error) throw error;
    return data[0];
  },
  
  async update(id, account) {
    const { data, error } = await supabase
      .from('accounts')
      .update(account)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },
  
  async delete(id) {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
