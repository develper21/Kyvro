import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, FileText, Phone, Users, Send, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Contact {
  name: string;
  phone: string;
  email?: string;
}

interface Template {
  name: string;
  category: string;
  language: string;
  status: string;
  components: Array<{
    type: string;
    text: string;
  }>;
}

const CreateCampaign: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messageVariables, setMessageVariables] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      // TODO: Load actual templates from WhatsApp API
      const mockTemplates: Template[] = [
        {
          name: 'welcome_message',
          category: 'MARKETING',
          language: 'en',
          status: 'APPROVED',
          components: [
            {
              type: 'body',
              text: 'Hello {{1}}, welcome to our service! We\'re excited to have you on board. Your account is now active and you can start using our features right away. Best regards, {{2}} team.'
            }
          ]
        },
        {
          name: 'product_announcement',
          category: 'MARKETING',
          language: 'en',
          status: 'APPROVED',
          components: [
            {
              type: 'header',
              text: 'New Product Launch! 🚀'
            },
            {
              type: 'body',
              text: 'Hi {{1}}, we\'re thrilled to announce our new product is now available! Get {{2}}% off your first purchase. Use code: {{3}}. Limited time offer!'
            }
          ]
        },
        {
          name: 'holiday_offer',
          category: 'MARKETING',
          language: 'en',
          status: 'APPROVED',
          components: [
            {
              type: 'body',
              text: 'Happy Holidays {{1}}! Special offer just for you - get {{2}}% off on all products. Visit our store or shop online. Offer valid until {{3}}. Wishing you a wonderful holiday season!'
            }
          ]
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileUpload(files);
  };

  const handleFileUpload = async (files: File[]) => {
    const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
    
    if (!csvFile) {
      alert('Please select a CSV file');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // TODO: Use CSV Web Worker for parsing
      // For now, simulate file upload and parsing
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate parsing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock parsed contacts
      const mockContacts: Contact[] = [
        { name: 'John Doe', phone: '+1234567890', email: 'john@example.com' },
        { name: 'Jane Smith', phone: '+0987654321', email: 'jane@example.com' },
        { name: 'Bob Johnson', phone: '+1122334455', email: 'bob@example.com' }
      ];

      setContacts(mockContacts);
      setIsUploading(false);
      setUploadProgress(0);
    } catch (error) {
      console.error('Failed to upload file:', error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const extractVariables = (template: Template) => {
    const variables: string[] = [];
    template.components.forEach(component => {
      const matches = component.text.match(/\{\{(\d+)\}\}/g);
      if (matches) {
        matches.forEach(match => {
          const num = match.replace(/[{}]/g, '');
          variables.push(`variable_${num}`);
        });
      }
    });
    return variables;
  };

  const renderPreviewMessage = () => {
    if (!selectedTemplate) return '';

    let message = '';
    selectedTemplate.components.forEach(component => {
      if (component.type === 'body' || component.type === 'header') {
        message += component.text + '\n';
      }
    });

    // Replace variables with actual values
    Object.entries(messageVariables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key.replace('variable_', '')}\\}\\}`, 'g');
      message = message.replace(regex, value || `{{${key.replace('variable_', '')}}}`);
    });

    return message.trim();
  };

  const canProceedToNext = () => {
    switch (step) {
      case 1:
        return campaignName.trim() !== '' && selectedTemplate !== null;
      case 2:
        return contacts.length > 0;
      case 3:
        return Object.keys(messageVariables).length === extractVariables(selectedTemplate!).length;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNext()) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleCreateCampaign = async () => {
    try {
      // TODO: Create campaign in database
      console.log('Creating campaign:', {
        name: campaignName,
        template: selectedTemplate?.name,
        contacts: contacts.length,
        variables: messageVariables
      });
      
      // Navigate to campaigns list
      navigate('/campaigns');
    } catch (error) {
      console.error('Failed to create campaign:', error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => navigate('/campaigns')}
          className="p-2 glass-dark rounded-lg hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Create Campaign</h1>
          <p className="text-gray-400">Set up your WhatsApp messaging campaign</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= stepNumber 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                : 'bg-gray-700 text-gray-400'
            }`}>
              {step > stepNumber ? <Check className="w-4 h-4" /> : stepNumber}
            </div>
            {stepNumber < 4 && (
              <div className={`w-16 h-1 mx-2 ${
                step > stepNumber ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="glass-card p-8 rounded-xl border border-white/10">
        {/* Step 1: Campaign Details */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Campaign Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Enter campaign name"
                    className="w-full px-4 py-2 bg-[#2a2a3e] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Template
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((template) => (
                      <div
                        key={template.name}
                        onClick={() => setSelectedTemplate(template)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedTemplate?.name === template.name
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-white">{template.name}</h3>
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                            {template.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">{template.category}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          {template.components[0]?.text.substring(0, 100)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Contact Import */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Import Contacts</h2>
              
              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/20 hover:border-white/30'
                }`}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-white font-medium mb-2">
                  Drop your CSV file here or click to browse
                </p>
                <p className="text-gray-400 text-sm mb-4">
                  Supports CSV files with columns: name, phone, email
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg cursor-pointer hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                >
                  <FileText className="w-4 h-4" />
                  <span>Select File</span>
                </label>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Uploading and parsing...</span>
                    <span className="text-white">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Imported Contacts */}
              {contacts.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">
                      Imported Contacts ({contacts.length})
                    </h3>
                    <button className="text-sm text-blue-400 hover:text-blue-300">
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                    {contacts.map((contact, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-[#2a2a3e] rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Users className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-white font-medium">{contact.name}</div>
                            <div className="text-sm text-gray-400">{contact.phone}</div>
                          </div>
                        </div>
                        <button className="text-red-400 hover:text-red-300">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Message Variables */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Message Variables</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Variables Input */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Set Variables</h3>
                  {extractVariables(selectedTemplate!).map((variable, index) => (
                    <div key={variable}>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {variable.replace('variable_', 'Variable ')}
                      </label>
                      <input
                        type="text"
                        value={messageVariables[variable] || ''}
                        onChange={(e) => setMessageVariables(prev => ({
                          ...prev,
                          [variable]: e.target.value
                        }))}
                        placeholder={`Enter value for ${variable}`}
                        className="w-full px-4 py-2 bg-[#2a2a3e] border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                  ))}
                </div>

                {/* Message Preview */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">Message Preview</h3>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="p-2 glass-dark rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {showPreview && (
                    <div className="bg-[#2a2a3e] border border-white/10 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <Phone className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-400">Mobile Preview</span>
                      </div>
                      <div className="bg-white rounded-lg p-4 text-gray-800 text-sm">
                        {renderPreviewMessage() || 'Set variables to see preview...'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Launch */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Review & Launch</h2>
              
              <div className="space-y-4">
                {/* Campaign Summary */}
                <div className="bg-[#2a2a3e] border border-white/10 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3">Campaign Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Campaign Name:</span>
                      <span className="text-white">{campaignName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Template:</span>
                      <span className="text-white">{selectedTemplate?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Contacts:</span>
                      <span className="text-white">{contacts.length.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Variables Set:</span>
                      <span className="text-white">{Object.keys(messageVariables).length}/{extractVariables(selectedTemplate!).length}</span>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                <div className="flex items-start space-x-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="text-yellow-400 font-medium mb-1">Important Notice</h4>
                    <p className="text-sm text-gray-300">
                      Make sure all recipient phone numbers have opted in to receive WhatsApp messages from your business. 
                      Sending messages to users who haven't opted in may result in account restrictions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={step === 1}
            className="px-6 py-2 glass-dark rounded-lg font-medium hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {step < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canProceedToNext()}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreateCampaign}
              className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Launch Campaign</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;
