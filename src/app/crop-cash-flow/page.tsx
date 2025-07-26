"use client";
import React, { useState } from "react";
import { Calculator, TrendingUp, DollarSign, FileText, BarChart3, Plus, ArrowRight, ShoppingCart, List, Trash2 } from "lucide-react";

interface CropData {
  id: string;
  name: string;
  area: number;
  inputCost: number;
  laborCost: number;
  expectedYield: number;
  expectedPrice: number;
  totalCost: number;
  expectedRevenue: number;
  expectedProfit: number;
}

interface ExpenseData {
  id: string;
  date: string;
  category: string;
  amount: number;
  notes: string;
}

interface SaleData {
  id: string;
  date: string;
  crop: string;
  quantity: number;
  price: number;
  buyer: string;
}

export default function CropCashFlowPage() {
  const [activeTab, setActiveTab] = useState("summary");
  // Crop state
  const [crops, setCrops] = useState<CropData[]>([
    {
      id: "1",
      name: "Wheat",
      area: 5,
      inputCost: 15000,
      laborCost: 8000,
      expectedYield: 2000,
      expectedPrice: 25,
      totalCost: 23000,
      expectedRevenue: 50000,
      expectedProfit: 27000
    },
    {
      id: "2", 
      name: "Rice",
      area: 3,
      inputCost: 12000,
      laborCost: 6000,
      expectedYield: 1500,
      expectedPrice: 30,
      totalCost: 18000,
      expectedRevenue: 45000,
      expectedProfit: 27000
    }
  ]);
  const [newCrop, setNewCrop] = useState({ name: "", area: "", inputCost: "", laborCost: "", expectedYield: "", expectedPrice: "" });
  // Expense state
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [newExpense, setNewExpense] = useState({ date: "", category: "", amount: "", notes: "" });
  // Sales state
  const [sales, setSales] = useState<SaleData[]>([]);
  const [newSale, setNewSale] = useState({ date: "", crop: "", quantity: "", price: "", buyer: "" });

  // Calculations
  const totalCropCost = crops.reduce((sum, crop) => sum + crop.totalCost, 0);
  const totalCropRevenue = crops.reduce((sum, crop) => sum + crop.expectedRevenue, 0);
  const totalCropProfit = crops.reduce((sum, crop) => sum + crop.expectedProfit, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSales = sales.reduce((sum, s) => sum + (s.quantity * s.price), 0);
  const netProfit = totalSales - totalExpenses;

  const handleAddCrop = () => {
    if (!newCrop.name || !newCrop.area || !newCrop.inputCost || !newCrop.laborCost || !newCrop.expectedYield || !newCrop.expectedPrice) {
      alert("Please fill all fields");
      return;
    }

    const crop: CropData = {
      id: Date.now().toString(),
      name: newCrop.name,
      area: parseFloat(newCrop.area),
      inputCost: parseFloat(newCrop.inputCost),
      laborCost: parseFloat(newCrop.laborCost),
      expectedYield: parseFloat(newCrop.expectedYield),
      expectedPrice: parseFloat(newCrop.expectedPrice),
      totalCost: parseFloat(newCrop.inputCost) + parseFloat(newCrop.laborCost),
      expectedRevenue: parseFloat(newCrop.expectedYield) * parseFloat(newCrop.expectedPrice),
      expectedProfit: (parseFloat(newCrop.expectedYield) * parseFloat(newCrop.expectedPrice)) - (parseFloat(newCrop.inputCost) + parseFloat(newCrop.laborCost))
    };

    setCrops([...crops, crop]);
    setNewCrop({
      name: "",
      area: "",
      inputCost: "",
      laborCost: "",
      expectedYield: "",
      expectedPrice: ""
    });
  };

  const handleDeleteCrop = (id: string) => {
    setCrops(crops.filter(crop => crop.id !== id));
  };

  // (Full implementation will be provided in the code edit)
} 