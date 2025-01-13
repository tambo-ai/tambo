import React, { useState, useEffect } from "react";
import ChatExample from "@/components/chat-example";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, ArrowRight, Mail, Phone, User, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const TransferComponent = () => {
  const [amount, setAmount] = useState("500");
  const [fromAccount, setFromAccount] = useState("checking");
  const [toAccount, setToAccount] = useState("mom");

  return (
    <Card className="w-full max-w-sm mx-auto mt-4 shadow-sm bg-card rounded-2xl overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-foreground">
          Transfer Money
        </h2>
        <div className="space-y-6">
          <div className="flex items-center">
            <DollarSign className="h-6 w-6 text-primary mr-2" />
            <Input
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-grow text-lg font-semibold"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Select value={fromAccount} onValueChange={setFromAccount}>
              <SelectTrigger className="w-full text-base">
                <SelectValue placeholder="From Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
              </SelectContent>
            </Select>
            <ArrowRight className="h-6 w-6 text-primary hidden sm:block" />
            <Select value={toAccount} onValueChange={setToAccount}>
              <SelectTrigger className="w-full text-base">
                <SelectValue placeholder="To Account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mom">Mom</SelectItem>
                <SelectItem value="vanguard">Vanguard</SelectItem>
                <SelectItem value="business">Business Account</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full text-lg font-semibold py-6">
            Transfer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const HSAAccountComponent = () => {
  const [contributionAmount, setContributionAmount] = useState(500);
  const [previousContribution, setPreviousContribution] = useState(250);

  const hsaData = {
    balance: 3500,
    yearToDate: 2000,
    limit: 3850,
  };

  const handleUpdateContribution = () => {
    setPreviousContribution(contributionAmount);
    // In a real app, you'd update the backend here
  };

  return (
    <Card className="w-full max-w-sm mx-auto mt-4 shadow-sm bg-card rounded-2xl overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <h2 className="text-lg font-bold mb-4 text-foreground">
          HSA Automated Contributions
        </h2>
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm sm:text-base text-foreground flex justify-between">
              <span className="font-semibold">Current Balance:</span>
              <span className="text-primary">${hsaData.balance}</span>
            </p>
            <p className="text-sm sm:text-base text-foreground flex justify-between">
              <span className="font-semibold">Year-to-Date Contributions:</span>
              <span className="text-green-600">${hsaData.yearToDate}</span>
            </p>
            <p className="text-sm sm:text-base text-foreground flex justify-between">
              <span className="font-semibold">Annual Contribution Limit:</span>
              <span className="text-blue-600">${hsaData.limit}</span>
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-sm sm:text-base text-foreground flex justify-between">
              <span className="font-semibold">Previous Contribution:</span>
              <span className="text-gray-600">
                ${previousContribution}/month
              </span>
            </p>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm sm:text-base">
                New Contribution:
              </span>
              <Input
                type="number"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(Number(e.target.value))}
                className="flex-grow text-base font-semibold"
              />
              <span className="text-sm sm:text-base">/month</span>
            </div>
          </div>
          <Button
            className="w-full text-base font-semibold py-4"
            onClick={handleUpdateContribution}
          >
            Update Contribution
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export const LeadsComponent = () => {
  const [leads, setLeads] = useState<Lead[]>([
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      phone: "123-456-7890",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "098-765-4321",
    },
    {
      id: 3,
      name: "Bob Johnson",
      email: "bob@example.com",
      phone: "555-555-5555",
    },
  ]);

  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const handleSendEmail = (lead: Lead) => {
    setSelectedLead(lead);
    setEmailDialogOpen(true);
  };

  return (
    <Card className="w-full max-w-sm mx-auto mt-2 shadow-sm bg-card rounded-lg overflow-hidden">
      <CardContent className="p-3">
        <h2 className="text-xl font-bold mb-3 text-foreground">
          Leads to Follow Up
        </h2>
        <div className="space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="flex flex-col items-start justify-between space-y-2 bg-secondary/10 p-2 rounded-md"
            >
              <div>
                <p className="font-bold text-base text-foreground">
                  {lead.name}
                </p>
                <p className="text-xs text-muted-foreground">{lead.email}</p>
              </div>
              <div className="flex space-x-2 w-full">
                <Button
                  size="sm"
                  onClick={() => handleSendEmail(lead)}
                  className="bg-primary hover:bg-primary/90 text-xs flex-1"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Button>
                <Button
                  size="sm"
                  className="bg-secondary hover:bg-secondary/90 text-xs flex-1"
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface Customer {
  id: string;
  name: string;
  email: string;
  plan: string;
  subscriptionStatus: string;
}

export const CustomerInfoComponent = () => {
  const [customer, setCustomer] = useState<Customer>({
    id: "123-acme",
    name: "Acme Corporation",
    email: "contact@acme.com",
    plan: "Premium",
    subscriptionStatus: "Active",
  });
  const [showUpgradeAnimation, setShowUpgradeAnimation] = useState(false);
  const [isUpgraded, setIsUpgraded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowUpgradeAnimation(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleCancelSubscription = () => {
    setCustomer({ ...customer, subscriptionStatus: "Cancelled" });
  };

  const handleUpgradePlan = () => {
    setCustomer({ ...customer, plan: "Premium Plus" });
    setShowUpgradeAnimation(false);
    setIsUpgraded(true);
  };

  return (
    <Card className="w-full max-w-sm mx-auto mt-4 shadow-sm bg-card rounded-2xl overflow-hidden">
      <CardContent className="p-3">
        <h2 className="text-lg font-bold mb-4 text-foreground">
          Customer Information
        </h2>
        <div className="space-y-4">
          <div className="space-y-2 bg-secondary/10 p-3 rounded-lg">
            <p className="text-sm sm:text-base text-foreground flex justify-between">
              <span className="font-semibold">ID:</span>
              <span>{customer.id}</span>
            </p>
            <p className="text-sm sm:text-base text-foreground flex justify-between">
              <span className="font-semibold">Name:</span>
              <span>{customer.name}</span>
            </p>
            <p className="text-sm sm:text-base text-foreground flex justify-between">
              <span className="font-semibold">Email:</span>
              <span>{customer.email}</span>
            </p>
            <p className="text-sm sm:text-base text-foreground flex justify-between">
              <span className="font-semibold">Plan:</span>
              <span className="text-primary font-bold">{customer.plan}</span>
            </p>
            <p className="text-sm sm:text-base text-foreground flex justify-between">
              <span className="font-semibold">Status:</span>
              <span
                className={
                  customer.subscriptionStatus === "Active"
                    ? "text-green-600 font-bold"
                    : "text-red-600 font-bold"
                }
              >
                {customer.subscriptionStatus}
              </span>
            </p>
          </div>
          <div className="flex flex-col space-y-2">
            <Button
              onClick={handleCancelSubscription}
              disabled={customer.subscriptionStatus === "Cancelled"}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
            >
              Cancel Subscription
            </Button>
            <Button
              onClick={handleUpgradePlan}
              disabled={customer.plan === "Premium Plus"}
              className={`w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white transition-all duration-300 ${
                showUpgradeAnimation
                  ? "animate-pulse ring-4 ring-green-400"
                  : ""
              }`}
            >
              Upgrade to Premium Plus
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const UpgradeMessageComponent: React.FC<{ customer: Customer }> = ({
  customer,
}) => {
  const [subject, setSubject] = useState("Your Account Upgrade Confirmation");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setEmail(customer.email);
    setMessage(
      `Dear ${customer.name},\n\nYour account has been upgraded to Premium Plus. Enjoy your new features!\n\nBest,\nYour Account Team`,
    );
  }, [customer]);

  const handleSendMessage = () => {
    // Logic to send the message would go here
    console.log("Sending message:", { email, subject, message });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-foreground">
        Send Upgrade Confirmation
      </h3>
      <Input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full"
      />
      <Input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject"
        className="w-full"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full h-32 p-2 text-sm border rounded-md resize-none"
        rows={6}
      />
      <Button
        onClick={handleSendMessage}
        className="w-full bg-primary hover:bg-primary/90 text-white"
      >
        Send Confirmation Message
      </Button>
    </div>
  );
};

const TransferExample = () => {
  return (
    <div className="space-y-8">
      <ChatExample
        userMessages={["Send $500 to my mom."]}
        components={[<TransferComponent key="transfer" />]}
        aiResponseTexts={[
          "Here is how you can send $500 to your mom's account:",
        ]}
      />
    </div>
  );
};

export default TransferExample;
