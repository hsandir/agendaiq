"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload as FiUpload, Plus as FiPlus, Users as FiUsers, Book as FiBook, Edit2 as FiEdit2, Trash2 as FiTrash2 } from "lucide-react";

interface School {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  website: string | null;
}

export default function SetupPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editSchool, setEditSchool] = useState<School | null>(null);
  const [form, setForm] = useState<Partial<School>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/school");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch schools");
      setSchools(Array.isArray(data) ? data : [data]);
    } catch (e) {
      setError((e instanceof Error ? e.message : String(e)) || "Failed to fetch schools");
    } finally {
      setLoading(false);
    }
  }

  function openAddModal() {
    setEditSchool(null);
    setForm({});
    setShowModal(true);
  }

  function openEditModal(school: School) {
    setEditSchool(school);
    setForm(school);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditSchool(null);
    setForm({});
  }

  async function handleDelete(school: School) {
    if (!window.confirm(`Delete school "${school.name}"?`)) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/school?id=${school.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete school");
      await fetchSchools();
    } catch (e) {
      alert((e instanceof Error ? e.message : String(e)) || "Failed to delete school");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editSchool ? "PUT" : "POST";
      const url = editSchool ? `/api/school?id=${editSchool.id}` : "/api/school";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save school");
      closeModal();
      await fetchSchools();
    } catch (e) {
      alert((e instanceof Error ? e.message : String(e)) || "Failed to save school");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">School District Setup</h2>
        <p className="text-muted-foreground">
          Configure your school district, schools, and import data.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>District Information</CardTitle>
            <CardDescription>Configure your school district details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">District Name</label>
                <input
                  type="text"
                  defaultValue="Central Jersey College Prep Charter School"
                  className="mt-1 block w-full rounded-md border border-border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Address</label>
                <input
                  type="text"
                  placeholder="District address"
                  className="mt-1 block w-full rounded-md border border-border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">City</label>
                  <input
                    type="text"
                    defaultValue="Somerset"
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">State</label>
                  <input
                    type="text"
                    defaultValue="NJ"
                    className="mt-1 block w-full rounded-md border border-border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <Button type="submit">Save District Information</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schools</CardTitle>
            <CardDescription>Manage schools in your district.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Current Schools</h3>
                <Button onClick={openAddModal}>
                  <FiPlus className="mr-2 h-4 w-4" />
                  Add School
                </Button>
              </div>
              {loading ? (
                <div>Loading...</div>
              ) : error ? (
                <div className="text-destructive">{error}</div>
              ) : (
                <div className="border rounded-lg divide-y">
                  {schools.map((school) => (
                    <div className="p-4 flex justify-between items-center" key={school.id}>
                      <div>
                        <h4 className="font-medium">{school.name}</h4>
                        <p className="text-sm text-muted-foreground">{school.address || "No address"}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => openEditModal(school)}><FiEdit2 className="mr-1" />Edit</Button>
                        <Button variant="destructive" onClick={() => handleDelete(school)} disabled={saving}><FiTrash2 className="mr-1" />Delete</Button>
                      </div>
                    </div>
                  ))}
                  {schools.length === 0 && <div className="p-4 text-muted-foreground">No schools found.</div>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Import</CardTitle>
            <CardDescription>Import staff and student data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 text-center">
                  <FiUsers className="mx-auto h-8 w-8 text-muted-foreground" />
                  <h3 className="mt-2 font-medium">Import Staff</h3>
                  <p className="text-sm text-muted-foreground mt-1">Upload staff data from Excel</p>
                  <Button variant="outline" className="mt-4" onClick={() => window.location.href = '/dashboard/settings/staff-upload'}>
                    <FiUpload className="mr-2 h-4 w-4" />
                    Upload Staff Data
                  </Button>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <FiBook className="mx-auto h-8 w-8 text-muted-foreground" />
                  <h3 className="mt-2 font-medium">Import Students</h3>
                  <p className="text-sm text-muted-foreground mt-1">Upload student data from Excel</p>
                  <Button variant="outline" className="mt-4">
                    <FiUpload className="mr-2 h-4 w-4" />
                    Upload Student Data
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium mb-4">{editSchool ? "Edit School" : "Add School"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">School Name</label>
                <input type="text" required className="mt-1 block w-full rounded-md border-border" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium">Address</label>
                <input type="text" className="mt-1 block w-full rounded-md border-border" value={form.address || ""} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">City</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-border" value={form.city || ""} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium">State</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-border" value={form.state || ""} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">ZIP Code</label>
                  <input type="text" className="mt-1 block w-full rounded-md border-border" value={form.zipCode || ""} onChange={e => setForm(f => ({ ...f, zipCode: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium">Phone</label>
                  <input type="tel" className="mt-1 block w-full rounded-md border-border" value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Website</label>
                <input type="url" className="mt-1 block w-full rounded-md border-border" value={form.website || ""} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 