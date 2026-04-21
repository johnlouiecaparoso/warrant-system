import { useState } from 'react';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Search as SearchIcon } from 'lucide-react';
import { Warrant } from '../data/models';
import { useSystem } from '../context/SystemContext';
import { useLocation } from 'react-router-dom';

export function Search() {
  const { warrants } = useSystem();
  const location = useLocation();
  const [searchName, setSearchName] = useState('');
  const [searchCaseNumber, setSearchCaseNumber] = useState('');
  const [searchBarangay, setSearchBarangay] = useState('');
  const [searchOffense, setSearchOffense] = useState('');
  const [searchStatus, setSearchStatus] = useState('all');
  const [searchOfficer, setSearchOfficer] = useState('');
  const [results, setResults] = useState<Warrant[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const globalQ = params.get('q') || '';
    if (globalQ) {
      setSearchName(globalQ);
      setHasSearched(true);
      setResults(
        warrants.filter((warrant) =>
          `${warrant.name} ${warrant.caseNumber} ${warrant.barangay} ${warrant.offense} ${warrant.assignedOfficer}`
            .toLowerCase()
            .includes(globalQ.toLowerCase()),
        ),
      );
    }
  }, [location.search, warrants]);

  const handleSearch = () => {
    const filtered = warrants.filter(warrant => {
      const matchesName = !searchName || warrant.name.toLowerCase().includes(searchName.toLowerCase());
      const matchesCaseNumber = !searchCaseNumber || warrant.caseNumber.toLowerCase().includes(searchCaseNumber.toLowerCase());
      const matchesBarangay = !searchBarangay || warrant.barangay.toLowerCase().includes(searchBarangay.toLowerCase());
      const matchesOffense = !searchOffense || warrant.offense.toLowerCase().includes(searchOffense.toLowerCase());
      const matchesStatus = searchStatus === 'all' || warrant.status === searchStatus;
      const matchesOfficer = !searchOfficer || warrant.assignedOfficer.toLowerCase().includes(searchOfficer.toLowerCase());

      return matchesName && matchesCaseNumber && matchesBarangay && matchesOffense && matchesStatus && matchesOfficer;
    });

    setResults(filtered);
    setHasSearched(true);
  };

  const handleClear = () => {
    setSearchName('');
    setSearchCaseNumber('');
    setSearchBarangay('');
    setSearchOffense('');
    setSearchStatus('all');
    setSearchOfficer('');
    setResults([]);
    setHasSearched(false);
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-orange-100 text-orange-700';
      case 'Served': return 'bg-green-100 text-green-700';
      case 'Unserved': return 'bg-red-100 text-red-700';
      case 'Cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search Warrants</h1>
        <p className="text-gray-600">Search for warrants using multiple criteria</p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="searchName">Name of Accused</Label>
              <Input
                id="searchName"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Enter name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="searchCaseNumber">Case Number</Label>
              <Input
                id="searchCaseNumber"
                value={searchCaseNumber}
                onChange={(e) => setSearchCaseNumber(e.target.value)}
                placeholder="CR-YYYY-XXX"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="searchBarangay">Barangay</Label>
              <Input
                id="searchBarangay"
                value={searchBarangay}
                onChange={(e) => setSearchBarangay(e.target.value)}
                placeholder="Enter barangay"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="searchOffense">Offense</Label>
              <Input
                id="searchOffense"
                value={searchOffense}
                onChange={(e) => setSearchOffense(e.target.value)}
                placeholder="Enter offense"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="searchStatus">Status</Label>
              <Select value={searchStatus} onValueChange={setSearchStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Served">Served</SelectItem>
                  <SelectItem value="Unserved">Unserved</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="searchOfficer">Assigned Officer</Label>
              <Input
                id="searchOfficer"
                value={searchOfficer}
                onChange={(e) => setSearchOfficer(e.target.value)}
                placeholder="Enter officer name"
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
              <SearchIcon className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({results.length} found)</CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No warrants found matching your criteria</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Case Number</TableHead>
                        <TableHead>Offense</TableHead>
                        <TableHead>Barangay</TableHead>
                        <TableHead>Assigned Officer</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((warrant) => (
                        <TableRow key={warrant.id}>
                          <TableCell className="font-medium">{warrant.name}</TableCell>
                          <TableCell>{warrant.caseNumber}</TableCell>
                          <TableCell>{warrant.offense}</TableCell>
                          <TableCell>{warrant.barangay}</TableCell>
                          <TableCell>{warrant.assignedOfficer}</TableCell>
                          <TableCell>
                            <Badge className={statusBadgeClass(warrant.status)}>
                              {warrant.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="md:hidden grid grid-cols-1 gap-4">
                  {results.map((warrant) => (
                    <Card key={warrant.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div>
                            <p className="font-semibold text-gray-900">{warrant.name}</p>
                            <p className="text-sm text-gray-500">{warrant.alias}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Case: {warrant.caseNumber}</p>
                            <p className="text-sm text-gray-600">Offense: {warrant.offense}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Barangay: {warrant.barangay}</p>
                            <p className="text-sm text-gray-600">Officer: {warrant.assignedOfficer}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Issued: {warrant.dateIssued}</p>
                          </div>
                          <Badge className={statusBadgeClass(warrant.status)}>
                            {warrant.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
