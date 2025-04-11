import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function DataUploadSection() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (csvData: string) => {
      const response = await apiRequest("POST", "/api/upload-csv", { csvData });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload successful",
        description: "Your transaction data has been processed.",
        variant: "default",
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/sustainability-score'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/category-breakdowns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        uploadMutation.mutate(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files.length) {
      const file = e.dataTransfer.files[0];
      if (file.type === "text/csv" || file.name.endsWith('.csv')) {
        handleFileUpload(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="mb-8 bg-white rounded-xl shadow-sm p-5 border border-neutral-200">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold font-heading text-neutral-800 mb-1">Import Transaction Data</h2>
          <p className="text-neutral-600 text-sm mb-4 md:mb-0">Upload your credit card transaction data to analyze environmental impact</p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary-dark text-white"
          onClick={handleClick}
          disabled={uploadMutation.isPending}
        >
          <Upload className="mr-2 h-4 w-4" />
          Import CSV File
        </Button>
      </div>
      
      <div 
        className={`mt-5 border-2 border-dashed ${
          isDragging ? 'border-primary bg-neutral-50' : 'border-neutral-300'
        } rounded-lg p-8 text-center cursor-pointer hover:bg-neutral-50`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mx-auto flex justify-center">
          <i className="ri-file-upload-line text-4xl text-neutral-400"></i>
        </div>
        <p className="mt-2 text-sm font-medium text-neutral-700">
          {uploadMutation.isPending ? 'Processing your data...' : 'Drag and drop your CSV file here'}
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          {uploadMutation.isPending ? 'This may take a moment' : 'Or click to browse files'}
        </p>
        <input 
          type="file" 
          accept=".csv" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={uploadMutation.isPending}
        />
      </div>
    </div>
  );
}
