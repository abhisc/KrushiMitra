'use client';
import React, { useEffect, useState } from "react";
import AppLayout from '@/components/agrimitra/app-layout';

// Example data
type Expert = {
  id: number;
  name: string;
  role: string;
  phone: string;
  region: string;
};

const allExperts: Expert[] = [
  // Karnataka
  { id: 1, name: "Dr. Ramesh Kumar", role: "Soil Scientist", phone: "+91 9876543210", region: "Karnataka" },
  { id: 2, name: "Mr. Suresh Patil", role: "Irrigation Advisor", phone: "+91 9988776655", region: "Karnataka" },
  
  // Tamil Nadu
  { id: 3, name: "Ms. Anjali Devi", role: "Crop Specialist", phone: "+91 9123456780", region: "Tamil Nadu" },
  { id: 4, name: "Dr. Rajesh Kumar", role: "Horticulture Expert", phone: "+91 9112345678", region: "Tamil Nadu" },
  
  // Maharashtra
  { id: 5, name: "Dr. Priya Singh", role: "Weather Expert", phone: "+91 9001122334", region: "Maharashtra" },
  { id: 6, name: "Mr. Amit Sharma", role: "Pest Management", phone: "+91 9223344556", region: "Maharashtra" },
  
  // Uttar Pradesh
  { id: 7, name: "Dr. Sunil Verma", role: "Crop Specialist", phone: "+91 9334455667", region: "Uttar Pradesh" },
  { id: 8, name: "Ms. Rekha Patel", role: "Soil Scientist", phone: "+91 9445566778", region: "Uttar Pradesh" },
  
  // Andhra Pradesh
  { id: 9, name: "Dr. Venkatesh Rao", role: "Rice Specialist", phone: "+91 9556677889", region: "Andhra Pradesh" },
  { id: 10, name: "Mr. Krishna Reddy", role: "Irrigation Expert", phone: "+91 9667788990", region: "Andhra Pradesh" },
  
  // Telangana
  { id: 11, name: "Dr. Madhavi Rao", role: "Cotton Specialist", phone: "+91 9778899001", region: "Telangana" },
  { id: 12, name: "Mr. Surya Kumar", role: "Crop Advisor", phone: "+91 9889900112", region: "Telangana" },
  
  // Gujarat
  { id: 13, name: "Dr. Patel Ramesh", role: "Groundnut Expert", phone: "+91 9990011223", region: "Gujarat" },
  { id: 14, name: "Ms. Meera Shah", role: "Dairy Specialist", phone: "+91 9101122334", region: "Gujarat" },
  
  // Punjab
  { id: 15, name: "Dr. Harpreet Singh", role: "Wheat Specialist", phone: "+91 9212233445", region: "Punjab" },
  { id: 16, name: "Mr. Gurpreet Kaur", role: "Pesticide Expert", phone: "+91 9323344556", region: "Punjab" },
  
  // Haryana
  { id: 17, name: "Dr. Rajesh Yadav", role: "Crop Protection", phone: "+91 9434455667", region: "Haryana" },
  { id: 18, name: "Ms. Sunita Devi", role: "Soil Health", phone: "+91 9545566778", region: "Haryana" },
  
  // Rajasthan
  { id: 19, name: "Dr. Mahesh Sharma", role: "Drought Management", phone: "+91 9656677889", region: "Rajasthan" },
  { id: 20, name: "Mr. Ramesh Kumar", role: "Water Conservation", phone: "+91 9767788990", region: "Rajasthan" },
  
  // Madhya Pradesh
  { id: 21, name: "Dr. Anjali Tiwari", role: "Soybean Expert", phone: "+91 9878899001", region: "Madhya Pradesh" },
  { id: 22, name: "Mr. Rajesh Malviya", role: "Crop Planning", phone: "+91 9989900112", region: "Madhya Pradesh" },
  
  // Bihar
  { id: 23, name: "Dr. Kumar Rajesh", role: "Rice Specialist", phone: "+91 9090011223", region: "Bihar" },
  { id: 24, name: "Ms. Priya Kumari", role: "Fertilizer Expert", phone: "+91 9201122334", region: "Bihar" },
  
  // West Bengal
  { id: 25, name: "Dr. Amit Das", role: "Jute Specialist", phone: "+91 9312233445", region: "West Bengal" },
  { id: 26, name: "Mr. Suman Banerjee", role: "Fish Farming", phone: "+91 9423344556", region: "West Bengal" },
  
  // Odisha
  { id: 27, name: "Dr. Bijay Mohanty", role: "Rice Expert", phone: "+91 9534455667", region: "Odisha" },
  { id: 28, name: "Ms. Laxmi Patra", role: "Tribal Farming", phone: "+91 9645566778", region: "Odisha" },
  
  // Kerala
  { id: 29, name: "Dr. Thomas George", role: "Spices Expert", phone: "+91 9756677889", region: "Kerala" },
  { id: 30, name: "Mr. Jose Mathew", role: "Coconut Specialist", phone: "+91 9867788990", region: "Kerala" },
  
  // Assam
  { id: 31, name: "Dr. Pranab Gogoi", role: "Tea Specialist", phone: "+91 9978899001", region: "Assam" },
  { id: 32, name: "Ms. Rita Bora", role: "Organic Farming", phone: "+91 9089900112", region: "Assam" },
  
  // Jharkhand
  { id: 33, name: "Dr. Sanjay Oraon", role: "Tribal Agriculture", phone: "+91 9190011223", region: "Jharkhand" },
  { id: 34, name: "Mr. Ramesh Munda", role: "Forest Farming", phone: "+91 9301122334", region: "Jharkhand" },
  
  // Chhattisgarh
  { id: 35, name: "Dr. Rajesh Sahu", role: "Paddy Expert", phone: "+91 9412233445", region: "Chhattisgarh" },
  { id: 36, name: "Ms. Sunita Verma", role: "Millets Specialist", phone: "+91 9523344556", region: "Chhattisgarh" },
  
  // Uttarakhand
  { id: 37, name: "Dr. Harish Rawat", role: "Horticulture", phone: "+91 9634455667", region: "Uttarakhand" },
  { id: 38, name: "Mr. Prakash Negi", role: "Apple Farming", phone: "+91 9745566778", region: "Uttarakhand" },
  
  // Himachal Pradesh
  { id: 39, name: "Dr. Ramesh Thakur", role: "Apple Expert", phone: "+91 9856677889", region: "Himachal Pradesh" },
  { id: 40, name: "Ms. Anita Sharma", role: "Floriculture", phone: "+91 9967788990", region: "Himachal Pradesh" },
  
  // Delhi
  { id: 41, name: "Dr. Amit Kumar", role: "Urban Farming", phone: "+91 9078899001", region: "Delhi" },
  { id: 42, name: "Ms. Neha Singh", role: "Hydroponics", phone: "+91 9189900112", region: "Delhi" },
  
  // Goa
  { id: 43, name: "Dr. Maria Fernandes", role: "Cashew Expert", phone: "+91 9290011223", region: "Goa" },
  { id: 44, name: "Mr. John D'Souza", role: "Poultry Farming", phone: "+91 9401122334", region: "Goa" },
  
  // Northeastern States
  { id: 45, name: "Dr. Nongthombam Singh", role: "Rice Specialist", phone: "+91 9512233445", region: "Manipur" },
  { id: 46, name: "Dr. Rakesh Das", role: "Bamboo Farming", phone: "+91 9623344556", region: "Meghalaya" },
  { id: 47, name: "Dr. Lalthanpuii", role: "Horticulture", phone: "+91 9734455667", region: "Mizoram" },
  { id: 48, name: "Dr. Neiphiu Rio", role: "Organic Farming", phone: "+91 9845566778", region: "Nagaland" },
  { id: 49, name: "Dr. Pawan Chamling", role: "Cardamom Expert", phone: "+91 9956677889", region: "Sikkim" },
  { id: 50, name: "Dr. Manik Sarkar", role: "Rubber Farming", phone: "+91 9067788990", region: "Tripura" },
  
  // Union Territories
  { id: 51, name: "Dr. Arunachal Singh", role: "Forest Farming", phone: "+91 9178899001", region: "Arunachal Pradesh" },
  { id: 52, name: "Dr. J&K Sharma", role: "Apple Specialist", phone: "+91 9289900112", region: "Jammu and Kashmir" },
  { id: 53, name: "Dr. Ladakh Lama", role: "High Altitude Farming", phone: "+91 9390011223", region: "Ladakh" },
  { id: 54, name: "Dr. Chandigarh Kumar", role: "Urban Agriculture", phone: "+91 9501122334", region: "Chandigarh" },
  { id: 55, name: "Dr. Puducherry Rao", role: "Rice Expert", phone: "+91 9612233445", region: "Puducherry" },
  { id: 56, name: "Dr. Lakshadweep Ali", role: "Coconut Farming", phone: "+91 9723344556", region: "Lakshadweep" },
  { id: 57, name: "Dr. Andaman Kumar", role: "Island Farming", phone: "+91 9834455667", region: "Andaman and Nicobar Islands" },
  { id: 58, name: "Dr. Daman Diu", role: "Coastal Farming", phone: "+91 9945566778", region: "Dadra and Nagar Haveli and Daman and Diu" },
];

const regions = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export default function FindExpertList() {
  const [region, setRegion] = useState("Karnataka"); // Default to Karnataka
  const [experts, setExperts] = useState<Expert[]>([]);

  useEffect(() => {
    console.log('Selected region:', region);
    const filteredExperts = allExperts.filter(e => e.region === region);
    setExperts(filteredExperts);
    console.log('Filtered experts for', region, ':', filteredExperts.length);
  }, [region]);

  return (
    <AppLayout
      title="Find an Expert"
      subtitle="Browse agriculture experts or call the Kisan Call Center for help."
      showBackButton={true}
    >
      <div className="max-w-md mx-auto p-4">
        <h2 className="text-xl font-bold text-green-700 mb-4">Nearby Agriculture Experts</h2>
        <label className="block mb-2 text-sm font-medium text-gray-700">Select your region:</label>
        <select value={region} onChange={e => setRegion(e.target.value)} className="mb-4 p-2 border rounded w-full bg-white text-gray-900 border-gray-300 focus:ring-green-500 focus:border-green-500">
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="space-y-4">
          {experts.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col items-start">
              <div className="text-green-800 font-semibold mb-1">Need expert advice in {region}?</div>
              <div className="text-gray-700 mb-2">Call the <span className="font-bold">Kisan Call Center</span> for free agricultural help in your language.</div>
              <div className="text-lg font-bold text-blue-900 mb-2">1800-180-1551</div>
              <a
                href="tel:18001801551"
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-base font-bold shadow hover:bg-green-700 active:bg-green-800 transition"
                style={{ minWidth: 120, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                Call Now
              </a>
              <a
                href="https://dackkms.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-blue-700 underline text-sm"
              >
                Visit Kisan Call Center Website
              </a>
            </div>
          ) : (
            <>
              {/* Information Section */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <h3 className="text-lg font-bold text-green-800 mb-2">📋 Expert Information for {region}</h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>• <strong>Available Experts:</strong> {experts.length} agricultural specialists</p>
                  <p>• <strong>Expert Types:</strong> {[...new Set(experts.map(e => e.role))].join(', ')}</p>
                  <p>• <strong>Response Time:</strong> Usually within 24 hours</p>
                </div>
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800">
                    💡 <strong>Tip:</strong> Call during business hours (9 AM - 6 PM) for faster response. 
                    Have your crop details ready for better assistance.
                  </p>
                </div>
              </div>
              
              {/* Expert List */}
              {experts.map((expert) => (
                <div key={expert.id} className="flex items-center justify-between bg-white rounded-xl shadow p-4">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{expert.name}</div>
                    <div className="text-sm text-gray-600">{expert.role}</div>
                    <div className="text-sm text-gray-700 mt-1">{expert.phone}</div>
                  </div>
                  <a
                    href={`tel:${expert.phone.replace(/\s+/g, "")}`}
                    className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg text-base font-bold shadow hover:bg-green-700 active:bg-green-800 transition"
                    style={{ minWidth: 80, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    Call
                  </a>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
} 