from django.forms.models import model_to_dict
from django.http import JsonResponse
import json
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from .models import TrsWorkentry,user_master,project_master,category_master,subcategory_master,task_master,workentry_pause


@csrf_exempt
def user_master_api(request):

    if request.method == 'GET':
        data = user_master.objects.all()
        return JsonResponse(list(data.values()),
         safe=False)

    elif request.method == 'POST':
        try:
            body = json.loads(request.body)
            obj = user_master.objects.create(
                user_name=body.get('user_name'),
                code=body.get('code'),
                user_role=body.get('user_role'),
                cost_per_hour=body.get('cost_per_hour'),
                user_status=body.get('user_status'),
                created_at=timezone.now(),
                updated_at=timezone.now()
            )
            return JsonResponse({
                "status": True,
                "message": "User created successfully",
                "id": obj.id
            })
        except Exception as e:
            return JsonResponse({
                "status": False,
                "message": str(e)
            }, status=400)

    elif request.method == 'PUT':
        try:
            body = json.loads(request.body)
            user_id = body.get('id')
            obj = user_master.objects.get(id=user_id)

            obj.user_name = body.get('user_name', obj.user_name)
            obj.user_role = body.get('user_role', obj.user_role)
            obj.cost_per_hour = body.get('cost_per_hour', obj.cost_per_hour)
            obj.user_status = body.get('user_status', obj.user_status)
            obj.updated_at = timezone.now()

            obj.save()

            return JsonResponse({
                "status": True,
                "message": "User updated successfully"
            })
        except user_master.DoesNotExist:
            return JsonResponse({
                "status": False,
                "message": "User not found"
            }, status=404)
    elif request.method == 'DELETE':
        try:
            body = json.loads(request.body)
            user_id = body.get('id')
            obj = user_master.objects.get(id=user_id)
            obj.delete()

            return JsonResponse({
                "status": True,
                "message": "User deleted successfully"
            })
        except user_master.DoesNotExist:
            return JsonResponse({
                "status": False,
                "message": "User not found"
            }, status=404)

    return JsonResponse({
        "status": False,
        "message": "Invalid request"
    }, status=405)

@csrf_exempt
def project_master_api(request):

    if request.method == 'GET':
        data = project_master.objects.all()
        return JsonResponse(list(data.values()),
         safe=False)

    elif request.method == 'POST':
        try:
            body = json.loads(request.body)
            obj = project_master.objects.create(
                project_name=body.get('project_name'),
                project_description=body.get('project_description'),
                created_at=timezone.now(),
                updated_at=timezone.now()
            )
            return JsonResponse({
                "status": True,
                "message": "Project created successfully",
                "id": obj.id
            })
        except Exception as e:
            return JsonResponse({
                "status": False,
                "message": str(e)
            }, status=400)

    elif request.method == 'PUT':
        try:
            body = json.loads(request.body)
            project_id = body.get('id')
            obj = project_master.objects.get(id=project_id)

            obj.project_name = body.get('project_name', obj.project_name)
            obj.project_description = body.get('project_description', obj.project_description)
            obj.updated_at = timezone.now()

            obj.save()

            return JsonResponse({
                "status": True,
                "message": "Project updated successfully"
            })
        except project_master.DoesNotExist:
            return JsonResponse({
                "status": False,
                "message": "Project not found"
            }, status=404)
    elif request.method == 'DELETE':
        try:
            body = json.loads(request.body)
            project_id = body.get('id')
            obj = project_master.objects.get(id=project_id)
            obj.delete()

            return JsonResponse({
                "status": True,
                "message": "Project deleted successfully"
            })
        except project_master.DoesNotExist:
            return JsonResponse({
                "status": False,
                "message": "Project not found"
            }, status=404)

    return JsonResponse({
        "status": False,
        "message": "Invalid request"
    }, status=405)


@csrf_exempt
def category_master_api(request):
    if request.method == 'GET':
        data = category_master.objects.all()
        return JsonResponse(list(data.values()), safe=False)

    elif request.method == 'POST':
        try:
            body = json.loads(request.body)
            obj = category_master.objects.create(
                category_name=body.get('category_name'),
                created_at=timezone.now(),
                updated_at=timezone.now()
            )
            return JsonResponse({
                "status": True,
                "message": "Category created successfully",
                "id": obj.id
            })
        except Exception as e:
            return JsonResponse({
                "status": False,
                "message": str(e)
            }, status=400)

    elif request.method == 'PUT':
        try:
            body = json.loads(request.body)
            category_id = body.get('id')
            obj = category_master.objects.get(id=category_id)

            obj.category_name = body.get('category_name', obj.category_name)
            obj.updated_at = timezone.now()

            obj.save()

            return JsonResponse({
                "status": True,
                "message": "Category updated successfully"
            })
        except category_master.DoesNotExist:
            return JsonResponse({
                "status": False,
                "message": "Category not found"
            }, status=404)
    elif request.method == 'DELETE':
        try:
            body = json.loads(request.body)
            category_id = body.get('id')
            obj = category_master.objects.get(id=category_id)
            obj.delete()

            return JsonResponse({
                "status": True,
                "message": "Category deleted successfully"
            })
        except category_master.DoesNotExist:
            return JsonResponse({
                "status": False,
                "message": "Category not found"
            }, status=404)

    return JsonResponse({
        "status": False,
        "message": "Invalid request"
    }, status=405)

@csrf_exempt
def subcategory_master_api(request):
    if request.method == 'GET':
        data = subcategory_master.objects.all()
        return JsonResponse(list(data.values()), safe=False)

    elif request.method == 'POST':
        try:
            body = json.loads(request.body)
            category_id = body.get('category_id')
            category = category_master.objects.get(id=category_id)

            obj = subcategory_master.objects.create(
                category=category,
                subcategory_name=body.get('subcategory_name'),
                created_at=timezone.now(),
                updated_at=timezone.now()
            )
            return JsonResponse({
                "status": True,
                "message": "Subcategory created successfully",
                "id": obj.id
            })
        except category_master.DoesNotExist:
            return JsonResponse({
                "status": False,
                "message": "Category not found"
            }, status=404)
        except Exception as e:
            return JsonResponse({
                "status": False,
                "message": str(e)
            }, status=400)

    elif request.method == 'PUT':
        try:
            body = json.loads(request.body)
            subcategory_id = body.get('id')
            obj = subcategory_master.objects.get(id=subcategory_id)

            category_id = body.get('category_id')
            if category_id:
                category = category_master.objects.get(id=category_id)
                obj.category = category

            obj.subcategory_name = body.get('subcategory_name', obj.subcategory_name)
            obj.updated_at = timezone.now()

            obj.save()

            return JsonResponse({
                "status": True,
                "message": "Subcategory updated successfully"
            })
        except subcategory_master.DoesNotExist:
            return JsonResponse({
                "status": False,
                "message": "Subcategory not found"
            }, status=404)
        except category_master.DoesNotExist:
            return JsonResponse({
                "status": False,
                "message": "Category not found"
            }, status=404)
    elif request.method == 'DELETE':
        try:
            body = json.loads(request.body)
            subcategory_id = body.get('id')
            obj = subcategory_master.objects.get(id=subcategory_id)
            obj.delete()

            return JsonResponse({
                "status": True,
                "message": "Subcategory deleted successfully"
            })
        except subcategory_master.DoesNotExist:
            return JsonResponse({
                "status": False,
                "message": "Subcategory not found"
            }, status=404)


@csrf_exempt
def task_master_api(request, id=None):
    if request.method == 'GET':
        data = task_master.objects.all(id=id) if id else task_master.objects.all()

        return JsonResponse(
            list(data.values(
                'id',
                'project_id',
                'code_id',       # Matches frontend
                'task_name',
                'task_description',
                'assing_date',
                'task_status',
                'task_start_date',
                'task_end_date',
                'created_at',
                'updated_at'
            )),
            safe=False
        )

    elif request.method == 'POST':
        try:
            body = json.loads(request.body)

            # FIX: Look for 'code_id' exactly as React sends it
            proj_id = body.get('project_id')
            user_id = body.get('code_id') 

            # Convert empty values to None
            if proj_id == "":
                proj_id = None
            if user_id == "":
                user_id = None

            # Create task
            obj = task_master.objects.create(
                project_id=proj_id,
                code_id=user_id,   
                task_name=body.get('task_name'),
                assing_date=body.get('assing_date'),
                task_description=body.get('task_description', ''),
                task_status=body.get('task_status', 'Pending')
            )

            return JsonResponse({
                "status": True,
                "message": "Task created successfully",
                "id": obj.id,
                "project_id": obj.project_id,
                "user_id": obj.code_id
            })

        except Exception as e:
            return JsonResponse({
                "status": False,
                "message": str(e)
            }, status=400)

    elif request.method in ['PUT', 'PATCH']:
        try:
            body = json.loads(request.body)
            
            # Prioritize the 'id' from the URL, fallback to the body payload
            task_id = id if id else body.get('id')
            
            if not task_id:
                return JsonResponse({"status": False, "message": "Task ID is required for update"}, status=400)

            obj = task_master.objects.get(id=task_id)

            # For PUT/PATCH, safely update only the fields provided in the payload
            if 'project_id' in body:
                proj_id = body.get('project_id')
                obj.project_id = None if proj_id == "" else proj_id
                
            if 'code_id' in body:
                user_id = body.get('code_id')
                obj.code_id = None if user_id == "" else user_id
                
            if 'task_name' in body:
                obj.task_name = body.get('task_name')
                
            if 'task_start_date' in body:
                obj.task_start_date = body.get('task_start_date')
                
            if 'task_end_date' in body:
                obj.task_end_date = body.get('task_end_date')
                
            if 'task_description' in body:
                obj.task_description = body.get('task_description')
                
            if 'task_status' in body:
                obj.task_status = body.get('task_status')
                
            obj.save()

            return JsonResponse({
                "status": True,
                "message": "Task updated successfully"
            })

        except task_master.DoesNotExist:
            return JsonResponse({"status": False, "message": "Task not found"}, status=404)
        except Exception as e:
            return JsonResponse({"status": False, "message": str(e)}, status=400)

    elif request.method == 'DELETE':
        try:
            body = json.loads(request.body)
            task_id = body.get('id')
            
            if not task_id:
                return JsonResponse({"status": False, "message": "Task ID is required for deletion"}, status=400)

            obj = task_master.objects.get(id=task_id)
            obj.delete()

            return JsonResponse({
                "status": True, 
                "message": "Task deleted successfully"
            })
            
        except task_master.DoesNotExist:
            return JsonResponse({"status": False, "message": "Task not found"}, status=404)
        except Exception as e:
            return JsonResponse({"status": False, "message": str(e)}, status=400)

    return JsonResponse({
        "status": False,
        "message": "Method not allowed"
    }, status=405)



@csrf_exempt
def trs_workentry(request, id=None):

    # GET ALL OR SINGLE RECORD
    if request.method == 'GET':
        if id:
            try:
                data = TrsWorkentry.objects.get(id=id)
                return JsonResponse(model_to_dict(data), safe=False)
            except TrsWorkentry.DoesNotExist:
                return JsonResponse(
                    {"status": False, "message": "Record not found"},
                    status=404
                )

        else:
            data = TrsWorkentry.objects.using('default').all()

            # Filters from query params
            name = request.GET.get('name')
            project = request.GET.get('project')
            entry_date = request.GET.get('date')

            if name:
                data = data.filter(username__icontains=name)

            if project:
                data = data.filter(projectname__icontains=project)

            if entry_date:
                data = data.filter(entrydate=entry_date)

            return JsonResponse(
                list(data.values()),
                safe=False
            )

    # INSERT
    elif request.method == 'POST':
        try:
            body = json.loads(request.body)

            obj = TrsWorkentry.objects.create(
                username=body.get('username'),
                entrydate=body.get('entrydate'),
                project=body.get('project'),
                category=body.get('category'),
                subcat=body.get('subcat'),
                startdatetime=body.get('startdatetime'),
                startstatus=body.get('startstatus'),
                description=body.get('description'),
                enddatetime=body.get('enddatetime'),
                endstatus=body.get('endstatus'),
                duration=body.get('duration'),
                durationminutes=body.get('durationminutes'),
                createddate=timezone.now(),
                modifieddate=timezone.now()
            )

            return JsonResponse({
                "status": True,
                "message": "Record created successfully",
                "id": obj.id
            })

        except Exception as e:
            return JsonResponse({
                "status": False,
                "message": str(e)
            }, status=400)

    # UPDATE
    elif request.method == 'PUT':
        try:
            if not id:
                return JsonResponse({
                    "status": False,
                    "message": "ID is required"
                }, status=400)

            body = json.loads(request.body)

            obj = TrsWorkentry.objects.get(id=id)

            obj.username = body.get('username', obj.username)
            obj.entrydate = body.get('entrydate', obj.entrydate)
            obj.project = body.get('project', obj.project)
            obj.category = body.get('category', obj.category)
            obj.subcat = body.get('subcat', obj.subcat)
            obj.startdatetime = body.get('startdatetime', obj.startdatetime)
            obj.startstatus = body.get('startstatus', obj.startstatus)
            obj.description = body.get('description', obj.description)
            obj.enddatetime = body.get('enddatetime', obj.enddatetime)
            obj.endstatus = body.get('endstatus', obj.endstatus)
            obj.duration = body.get('duration', obj.duration)
            obj.durationminutes = body.get(
                'durationminutes',
                obj.durationminutes
            )
            obj.modifieddate = timezone.now()

            obj.save()

            return JsonResponse({
                "status": True,
                "message": "Record updated successfully"
            })

        except TrsWorkentry.DoesNotExist:
            return JsonResponse({
                "status": False,
                "message": "Record not found"
            }, status=404)

    # DELETE
    elif request.method == 'DELETE':
        try:
            if not id:
                return JsonResponse({
                    "status": False,
                    "message": "ID is required"
                }, status=400)

            obj = TrsWorkentry.objects.get(id=id)
            obj.delete()

            return JsonResponse({
                "status": True,
                "message": "Record deleted successfully"
            })

        except TrsWorkentry.DoesNotExist:
            return JsonResponse({
                "status": False,
                "message": "Record not found"
            }, status=404)

    return JsonResponse({
        "status": False,
        "message": "Invalid request"
    }, status=405)


@csrf_exempt
def workentry_pause_api(request):

    # ==========================================================
    # GET
    # ==========================================================
    if request.method == 'GET':
        try:
            pauses = workentry_pause.objects.select_related('workentry').all()

            data = []

            for pause in pauses:
                data.append({
                    "id": pause.id,

                    "workentry_id": pause.workentry_id,

                    "pause_start_time": pause.pause_start_time,
                    "pause_end_time": pause.pause_end_time,
                    "pause_reason": pause.pause_reason,

                    "created_at": pause.created_at,
                    "updated_at": pause.updated_at,
                })

            return JsonResponse({
                "status": True,
                "data": data
            })

        except Exception as e:
            return JsonResponse({
                "status": False,
                "message": str(e)
            }, status=500)

    # ==========================================================
    # POST
    # ==========================================================
    elif request.method == 'POST':
        try:
            body = json.loads(request.body)

            workentry_id = body.get('workentry_id')
            pause_start_time = body.get('pause_start_time')
            pause_end_time = body.get('pause_end_time')
            pause_reason = body.get('pause_reason')

            # Validate workentry
            if not workentry_id:
                return JsonResponse({
                    "status": False,
                    "message": "workentry_id is required"
                }, status=400)

            if not pause_start_time:
                return JsonResponse({
                    "status": False,
                    "message": "pause_start_time is required"
                }, status=400)

            # Check workentry exists
            try:
                workentry = TrsWorkentry.objects.get(id=workentry_id)
            except TrsWorkentry.DoesNotExist:
                return JsonResponse({
                    "status": False,
                    "message": "Workentry not found"
                }, status=404)

            # Create pause
            pause = workentry_pause.objects.create(
                workentry=workentry,
                pause_start_time=pause_start_time,
                pause_end_time=pause_end_time if pause_end_time else None,
                pause_reason=pause_reason if pause_reason else None
            )

            return JsonResponse({
                "status": True,
                "message": "Workentry pause created successfully",
                "data": {
                    "id": pause.id,
                    "workentry_id": pause.workentry_id,
                    "pause_start_time": pause.pause_start_time,
                    "pause_end_time": pause.pause_end_time,
                    "pause_reason": pause.pause_reason,
                    "created_at": pause.created_at,
                    "updated_at": pause.updated_at
                }
            }, status=201)

        except json.JSONDecodeError:
            return JsonResponse({
                "status": False,
                "message": "Invalid JSON"
            }, status=400)

        except Exception as e:
            return JsonResponse({
                "status": False,
                "message": str(e)
            }, status=400)

    # ==========================================================
    # PUT
    # ==========================================================
    elif request.method == 'PUT':
        try:
            body = json.loads(request.body)

            # Get pause ID
            pause_id = body.get('id')

            if not pause_id:
                return JsonResponse({
                    "status": False,
                    "message": "id is required"
                }, status=400)

            # Find pause
            try:
                pause = workentry_pause.objects.get(id=pause_id)
            except workentry_pause.DoesNotExist:
                return JsonResponse({
                    "status": False,
                    "message": "Pause record not found"
                }, status=404)

            # Update workentry if provided
            if 'workentry_id' in body:

                workentry_id = body.get('workentry_id')

                try:
                    workentry = TrsWorkentry.objects.get(id=workentry_id)
                    pause.workentry = workentry
                except TrsWorkentry.DoesNotExist:
                    return JsonResponse({
                        "status": False,
                        "message": "Workentry not found"
                    }, status=404)

            # Update start time if provided
            if 'pause_start_time' in body:
                pause.pause_start_time = body.get('pause_start_time')

            # Update end time if provided
            if 'pause_end_time' in body:
                pause.pause_end_time = (
                    body.get('pause_end_time')
                    if body.get('pause_end_time')
                    else None
                )

            pause.save()

            return JsonResponse({
                "status": True,
                "message": "Workentry pause updated successfully",
                "data": {
                    "id": pause.id,
                    "workentry_id": pause.workentry_id,
                    "pause_start_time": pause.pause_start_time,
                    "pause_end_time": pause.pause_end_time,
                    "created_at": pause.created_at,
                    "updated_at": pause.updated_at
                }
            })

        except json.JSONDecodeError:
            return JsonResponse({
                "status": False,
                "message": "Invalid JSON"
            }, status=400)

        except Exception as e:
            return JsonResponse({
                "status": False,
                "message": str(e)
            }, status=400)

    # ==========================================================
    # INVALID METHOD
    # ==========================================================
    return JsonResponse({
        "status": False,
        "message": "Method not allowed"
    }, status=405)