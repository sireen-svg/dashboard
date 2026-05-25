import { useState, useEffect, useCallback } from 'react';
import { Outlet, useParams, Navigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import Sidebar from './Sidebar';
import { getProject, getDataTypes, getFields, updateProject as updateProjectApi, deleteProject as deleteProjectApi } from '../../api/cms';
import { showToast } from '../Toast';
import { getApiError } from '../../lib/utils';

export default function ProjectLayout() {
  const { slug } = useParams();
  const [project, setProject] = useState(null);
  const [dataTypes, setDataTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      const res = await getProject(slug);
      const proj = res.data?.data || res.data;
      setProject(proj);
      localStorage.setItem('active_project_key', proj.public_id);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        showToast(getApiError(err), 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const loadDataTypes = useCallback(async () => {
    try {
      const res = await getDataTypes();
      const list = res.data?.data || res.data || [];
      // The list endpoint doesn't eager-load fields, so the dashboard / schema-builder
      // counts come back as zero. Fetch them per-type and attach so consumers can read
      // `dt.fields.length` accurately.
      const withFields = await Promise.all(
        list.map(async (dt) => {
          if (Array.isArray(dt.fields) && dt.fields.length > 0) return dt;
          if (!dt?.id) return { ...dt, fields: dt.fields || [] };
          try {
            const fieldsRes = await getFields(dt.id);
            const fields = fieldsRes.data?.data || fieldsRes.data || [];
            return { ...dt, fields };
          } catch {
            return { ...dt, fields: dt.fields || [] };
          }
        }),
      );
      setDataTypes(withFields);
    } catch {
      // Data types will be empty
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    loadProject();
    loadDataTypes();
  }, [loadProject, loadDataTypes]);

  async function handleUpdateProject(data) {
    try {
      await updateProjectApi(project.slug, data);
      await loadProject();
      showToast('Project updated', 'success');
    } catch (err) {
      showToast(getApiError(err), 'error');
    }
  }

  async function handleDeleteProject() {
    try {
      await deleteProjectApi(project.slug);
      localStorage.removeItem('active_project_key');
      return true;
    } catch (err) {
      showToast(getApiError(err), 'error');
      return false;
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (notFound || !project) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="d-flex">
      <Sidebar
        projectSlug={project.slug}
        projectName={project.name}
        dataTypes={dataTypes}
        enabledModules={project.enabled_modules || []}
      />
      <div className="content-area">
        <Outlet context={{
          project,
          dataTypes,
          onUpdateProject: handleUpdateProject,
          onDeleteProject: handleDeleteProject,
          refreshProject: loadProject,
          refreshDataTypes: loadDataTypes,
        }} />
      </div>
    </div>
  );
}
