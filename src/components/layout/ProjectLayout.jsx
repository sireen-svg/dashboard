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
  // Tracked separately from `loading`: the project is one quick request, while
  // the data types need a list call plus one call per type, so it finishes much
  // later. Without its own flag, consumers render an empty schema as if it were
  // loaded.
  const [dataTypesLoading, setDataTypesLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Returns true once `active_project_key` holds THIS project. Every CMS
  // request is scoped by that key (the axios interceptor sends it as
  // X-Project-Key), so nothing else may be fetched until it has been written.
  const loadProject = useCallback(async () => {
    try {
      const res = await getProject(slug);
      const proj = res.data?.data || res.data;
      setProject(proj);
      localStorage.setItem('active_project_key', proj.public_id);
      return true;
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        showToast(getApiError(err), 'error');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const loadDataTypes = useCallback(async () => {
    setDataTypesLoading(true);
    try {
      const res = await getDataTypes();
      const list = res.data?.data || res.data || [];
      // The list endpoint doesn't eager-load fields, so the dashboard / schema-builder
      // counts come back as zero. Fetch them per-type and attach so consumers can read
      // `dt.fields.length` accurately.
      const withFields = await Promise.all(
        list.map(async (dt) => {
          if (Array.isArray(dt.fields) && dt.fields.length > 0) return dt;
          if (!dt?.slug) return { ...dt, fields: dt.fields || [] };
          try {
            const fieldsRes = await getFields(dt.slug);
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
    } finally {
      setDataTypesLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setNotFound(false);
      // Drop the previous project's types immediately. Keeping them around let
      // you act on another project's ids - creating an entry from a stale list
      // saved it with that project's data_type_id under this project's id.
      setDataTypes([]);
      setDataTypesLoading(true);

      // Must be awaited: loadProject writes `active_project_key`, and every
      // request loadDataTypes makes is scoped by that key. Running them
      // concurrently fetched the PREVIOUS project's data types.
      const ok = await loadProject();
      if (cancelled) return;
      if (!ok) {
        setDataTypesLoading(false);
        return;
      }
      await loadDataTypes();
    })();

    return () => {
      cancelled = true;
    };
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
          dataTypesLoading,
          onUpdateProject: handleUpdateProject,
          onDeleteProject: handleDeleteProject,
          refreshProject: loadProject,
          refreshDataTypes: loadDataTypes,
        }} />
      </div>
    </div>
  );
}
