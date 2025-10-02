
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SearchBar } from './components/SearchBar';
import { ResultsTable } from './components/ResultsTable';
import { Scanner } from './components/Scanner';
import { Spinner } from './components/Spinner';
import { useExcelProcessor } from './hooks/useExcelProcessor';
import type { ExcelData } from './types';
import { FileIcon } from './components/Icons';

const App: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isScannerVisible, setScannerVisible] = useState<boolean>(false);
    const [fileName, setFileName] = useState<string | null>(null);

    const {
        data,
        headers,
        results,
        isLoading,
        error,
        processFile,
        search,
    } = useExcelProcessor();

    useEffect(() => {
        const storedData = localStorage.getItem('excelData');
        const storedFileName = localStorage.getItem('excelFileName');
        if (storedData && storedFileName) {
            try {
                const parsedData: ExcelData = JSON.parse(storedData);
                processFile(parsedData, true);
                setFileName(storedFileName);
            } catch (e) {
                console.error("Failed to parse stored Excel data:", e);
                localStorage.removeItem('excelData');
                localStorage.removeItem('excelFileName');
            }
        }
    }, [processFile]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSearchQuery('');
        setFileName(file.name);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileData = e.target?.result;
            if (fileData) {
                const workbook = (window as any).XLSX.read(fileData, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: (string | number)[][] = (window as any).XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                const excelData: ExcelData = {
                    // FIX: Ensure all header values are strings to match the `ExcelData` type.
                    headers: (json[0] || []).map(String),
                    rows: json.slice(1) || [],
                };
                
                localStorage.setItem('excelData', JSON.stringify(excelData));
                localStorage.setItem('excelFileName', file.name);
                processFile(excelData, false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        if (query.trim() === '') {
           search('');
        } else {
           search(query);
        }
    };

    const handleScanSuccess = (decodedText: string) => {
        setScannerVisible(false);
        handleSearchChange(decodedText);
    };

    const displayResults = useMemo(() => {
        if (searchQuery.trim() === '') return [];
        return results;
    }, [searchQuery, results]);

    return (
        <div className="min-h-screen bg-gray-900 font-sans text-gray-100">
            <div className="container mx-auto p-4 max-w-4xl">
                <header className="text-center my-6">
                    <h1 className="text-4xl font-bold text-blue-400">Fuzzy Excel Search</h1>
                    <p className="text-gray-400 mt-2">Importez, recherchez et scannez vos données Excel en un clin d'œil.</p>
                </header>

                <main className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <SearchBar
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onScanClick={() => setScannerVisible(true)}
                        />
                        <label className="flex-shrink-0 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center">
                            <FileIcon className="w-5 h-5 mr-2" />
                            Importer fichier
                            <input
                                type="file"
                                accept=".xlsx"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>

                    {fileName && (
                        <p className="text-sm text-gray-400 mb-4 text-center sm:text-left">Fichier chargé : <span className="font-semibold text-gray-200">{fileName}</span></p>
                    )}

                    {error && <p className="text-red-400 bg-red-900/50 border border-red-500 p-3 rounded-md">{error}</p>}
                    
                    <div className="mt-4 min-h-[400px]">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full">
                                <Spinner />
                            </div>
                        ) : (
                            <ResultsTable 
                                headers={headers} 
                                data={displayResults}
                                hasSearched={searchQuery.trim().length > 0}
                            />
                        )}
                    </div>
                </main>

                {isScannerVisible && (
                    <Scanner
                        onClose={() => setScannerVisible(false)}
                        onScanSuccess={handleScanSuccess}
                    />
                )}
            </div>
        </div>
    );
};

export default App;
